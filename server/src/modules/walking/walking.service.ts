import { Types } from 'mongoose';
import {
  WalkingSession,
  WalkingSessionStatus,
  WalkingSessionSource,
  IWalkingSessionDocument,
} from './walking-session.model.js';
import { ActivityRecord, ActivitySource } from '../activity/activity.model.js';
import { ActivityService } from '../activity/activity.service.js';

export interface StartWalkingInput {
  sessionId: string;
  source?: WalkingSessionSource;
  startTime?: Date | string;
  notes?: string;
}

export interface UpdateWalkingProgressInput {
  steps?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface CompleteWalkingInput extends UpdateWalkingProgressInput {
  endTime?: Date | string;
}

export class WalkingService {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Start a real-time walking session (Idempotent by sessionId)
   */
  async startSession(userId: string, input: StartWalkingInput): Promise<IWalkingSessionDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const existing = await WalkingSession.findOne({ sessionId: input.sessionId });
    if (existing) {
      return existing;
    }

    // Cancel any previous active sessions if any were left uncompleted
    await WalkingSession.updateMany(
      { userId: userObjectId, status: { $in: [WalkingSessionStatus.ACTIVE, WalkingSessionStatus.PAUSED] } },
      { $set: { status: WalkingSessionStatus.CANCELLED } }
    );

    const dateString = this.getTodayString();
    const session = await WalkingSession.create({
      userId: userObjectId,
      sessionId: input.sessionId,
      startTime: input.startTime ? new Date(input.startTime) : new Date(),
      status: WalkingSessionStatus.ACTIVE,
      source: input.source || WalkingSessionSource.ANDROID_STEP_COUNTER,
      notes: input.notes,
      dateString,
      steps: 0,
      distanceMeters: 0,
      durationSeconds: 0,
      caloriesBurned: 0,
    });

    return session;
  }

  /**
   * Pause an active walking session
   */
  async pauseSession(
    userId: string,
    sessionId: string,
    input?: UpdateWalkingProgressInput
  ): Promise<IWalkingSessionDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    const updates: any = { status: WalkingSessionStatus.PAUSED };

    if (input?.steps !== undefined) updates.steps = input.steps;
    if (input?.distanceMeters !== undefined) updates.distanceMeters = input.distanceMeters;
    if (input?.durationSeconds !== undefined) updates.durationSeconds = input.durationSeconds;
    if (input?.caloriesBurned !== undefined) updates.caloriesBurned = input.caloriesBurned;
    if (input?.notes) updates.notes = input.notes;

    const session = await WalkingSession.findOneAndUpdate(
      { userId: userObjectId, sessionId },
      { $set: updates },
      { new: true }
    );

    return session;
  }

  /**
   * Resume a paused walking session
   */
  async resumeSession(userId: string, sessionId: string): Promise<IWalkingSessionDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    const session = await WalkingSession.findOneAndUpdate(
      { userId: userObjectId, sessionId },
      { $set: { status: WalkingSessionStatus.ACTIVE } },
      { new: true }
    );
    return session;
  }

  /**
   * Complete a walking session and sync to Activity Record & Dashboard
   */
  async completeSession(
    userId: string,
    sessionId: string,
    input: CompleteWalkingInput
  ): Promise<{ session: IWalkingSessionDocument; todaySummary: any }> {
    const userObjectId = new Types.ObjectId(userId);
    const endTime = input.endTime ? new Date(input.endTime) : new Date();

    const session = await WalkingSession.findOneAndUpdate(
      { userId: userObjectId, sessionId },
      {
        $set: {
          steps: input.steps || 0,
          distanceMeters: input.distanceMeters || 0,
          durationSeconds: input.durationSeconds || 0,
          caloriesBurned: input.caloriesBurned || 0,
          status: WalkingSessionStatus.COMPLETED,
          endTime,
          notes: input.notes,
        },
      },
      { new: true }
    );

    if (!session) {
      throw new Error(`Walking session ${sessionId} not found`);
    }

    // Automatically record to ActivityRecord so UYIRA Dashboard, Wellness Hub & Analytics reflect it
    if (session.steps > 0) {
      const distanceKm = Math.round((session.distanceMeters / 1000) * 100) / 100;
      const activeDurationMinutes = Math.round(session.durationSeconds / 60);

      await ActivityRecord.create({
        userId: userObjectId,
        activityType: 'WALKING',
        steps: session.steps,
        distanceKm,
        activeDurationMinutes,
        estimatedCalories: session.caloriesBurned,
        source: ActivitySource.PEDOMETER,
        dateString: session.dateString,
        recordedAt: session.endTime || new Date(),
        notes: `Walking Workout: ${session.steps.toLocaleString()} steps in ${activeDurationMinutes} mins`,
      });
    }

    const todaySummary = await this.activityService.getTodaySummary(userId);
    return { session, todaySummary };
  }

  /**
   * Retrieve active session if user reopened app while walking
   */
  async getActiveSession(userId: string): Promise<IWalkingSessionDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    return WalkingSession.findOne({
      userId: userObjectId,
      status: { $in: [WalkingSessionStatus.ACTIVE, WalkingSessionStatus.PAUSED] },
    }).sort({ createdAt: -1 });
  }

  /**
   * Get historical walking sessions
   */
  async getSessionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ sessions: IWalkingSessionDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      WalkingSession.find({ userId: userObjectId, status: WalkingSessionStatus.COMPLETED })
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      WalkingSession.countDocuments({ userId: userObjectId, status: WalkingSessionStatus.COMPLETED }),
    ]);

    return { sessions, total };
  }

  /**
   * Get daily walking sessions total summary
   */
  async getDailySummary(userId: string, dateString?: string): Promise<any> {
    const userObjectId = new Types.ObjectId(userId);
    const date = dateString || this.getTodayString();

    const sessions = await WalkingSession.find({
      userId: userObjectId,
      dateString: date,
      status: WalkingSessionStatus.COMPLETED,
    });

    const totalSteps = sessions.reduce((acc, s) => acc + s.steps, 0);
    const totalDistanceMeters = sessions.reduce((acc, s) => acc + s.distanceMeters, 0);
    const totalDurationSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalCaloriesBurned = sessions.reduce((acc, s) => acc + s.caloriesBurned, 0);

    return {
      date,
      sessionCount: sessions.length,
      totalSteps,
      totalDistanceKm: Math.round((totalDistanceMeters / 1000) * 100) / 100,
      totalDurationMinutes: Math.round(totalDurationSeconds / 60),
      totalCaloriesBurned,
      sessions,
    };
  }
}

