import { authRepository, AuthRepository } from './auth.repository.js';
import { verificationService, VerificationService } from '../verification/verification.service.js';
import { sessionService, SessionService } from '../sessions/session.service.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signResetToken, verifyResetToken } from '../../utils/jwt.js';
import { AppError } from '../../errors/AppError.js';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from './auth.types.js';
import { UserResponseDto, IUserDocument } from '../users/user.types.js';
import { UserModel } from '../users/user.model.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';

export class AuthService {
  constructor(
    private authRepo: AuthRepository = authRepository,
    private verificationSvc: VerificationService = verificationService,
    private sessionSvc: SessionService = sessionService
  ) {}

  private mapToUserDto(user: IUserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber || undefined,
      profilePhoto: user.profilePhoto || undefined,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined,
      gender: user.gender,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async register(
    dto: RegisterDto
  ): Promise<{ userId: string; recipient: string; channel: string; nextResendAllowedIn: number }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedMobile = dto.mobileNumber ? dto.mobileNumber.trim() : undefined;

    // 1. Check for duplicates
    const existingEmail = await this.authRepo.findByNormalizedEmail(normalizedEmail);
    if (existingEmail) {
      if (!existingEmail.isVerified) {
        // Unverified user registered again: re-issue OTP
        const { nextResendAllowedIn } = await this.verificationSvc.issueOtp(
          existingEmail._id.toString(),
          existingEmail.email,
          'REGISTRATION',
          'EMAIL'
        );
        return {
          userId: existingEmail._id.toString(),
          recipient: existingEmail.email,
          channel: 'EMAIL',
          nextResendAllowedIn,
        };
      }
      throw new AppError('An account with this email address already exists', 409);
    }

    if (normalizedMobile) {
      const existingMobile = await this.authRepo.findByNormalizedMobile(normalizedMobile);
      if (existingMobile) {
        throw new AppError('An account with this mobile number already exists', 409);
      }
    }

    // 2. Hash password
    const passwordHash = await hashPassword(dto.password);

    // 3. Create pending user
    const userPayload: any = {
      fullName: dto.fullName.trim(),
      email: dto.email.trim(),
      normalizedEmail,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender || 'prefer_not_to_say',
      passwordHash,
      isVerified: false,
      verificationChannel: 'EMAIL',
      accountStatus: 'PENDING_VERIFICATION',
    };

    if (dto.mobileNumber && dto.mobileNumber.trim()) {
      userPayload.mobileNumber = dto.mobileNumber.trim();
    }
    if (normalizedMobile) {
      userPayload.normalizedMobileNumber = normalizedMobile;
    }

    const newUser = await this.authRepo.createUser(userPayload);

    // 4. Issue OTP
    const { nextResendAllowedIn } = await this.verificationSvc.issueOtp(
      newUser._id.toString(),
      newUser.email,
      'REGISTRATION',
      'EMAIL'
    );

    return {
      userId: newUser._id.toString(),
      recipient: newUser.email,
      channel: 'EMAIL',
      nextResendAllowedIn,
    };
  }

  async verifyRegistrationOtp(dto: VerifyOtpDto): Promise<{ user: UserResponseDto }> {
    const user = await this.authRepo.findById(dto.userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    if (user.isVerified) {
      return { user: this.mapToUserDto(user) };
    }

    await this.verificationSvc.verifyOtp(dto.userId, dto.otp, 'REGISTRATION');
    const updated = await this.authRepo.markAsVerified(dto.userId);
    if (!updated) {
      throw new AppError('Failed to activate account', 500);
    }

    return { user: this.mapToUserDto(updated) };
  }

  async resendRegistrationOtp(dto: ResendOtpDto): Promise<{ nextResendAllowedIn: number }> {
    const user = await this.authRepo.findById(dto.userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    if (user.isVerified) {
      throw new AppError('This account is already verified. Please sign in.', 400);
    }

    return this.verificationSvc.issueOtp(
      user._id.toString(),
      user.email,
      'REGISTRATION',
      user.verificationChannel
    );
  }

  async login(
    dto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.authRepo.findByIdentifier(dto.identifier);
    if (!user) {
      throw new AppError('Invalid email/mobile number or password', 401);
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account is temporarily locked due to multiple failed attempts. Please try again in ${waitMinutes} minutes.`,
        423
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockUntil: Date | undefined;
      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await this.authRepo.incrementFailedLogin(user._id.toString(), lockUntil);

      throw new AppError('Invalid email/mobile number or password', 401);
    }

    // Check if account is verified
    if (!user.isVerified) {
      // Re-issue registration OTP
      await this.verificationSvc.issueOtp(
        user._id.toString(),
        user.email,
        'REGISTRATION',
        user.verificationChannel
      );

      const error = new AppError(
        'Your account has not been verified yet. A new verification code has been sent.',
        403,
        'ACCOUNT_NOT_VERIFIED'
      );
      (error as any).data = {
        userId: user._id.toString(),
        recipient: user.email,
        channel: user.verificationChannel,
      };
      throw error;
    }

    // Check account status
    if (user.accountStatus !== 'ACTIVE') {
      throw new AppError(`Your account is currently ${user.accountStatus.toLowerCase()}`, 403);
    }

    // Reset failed login count
    if (user.failedLoginAttempts > 0) {
      await this.authRepo.resetFailedLogin(user._id.toString());
    }

    // Generate tokens and session
    const tokens = await this.sessionSvc.createSession(
      user._id.toString(),
      user.normalizedEmail,
      user.isVerified,
      deviceInfo,
      ipAddress
    );

    const userDto = this.mapToUserDto(user);
    if (!userDto.profilePhoto) {
      try {
        const hp = await HealthProfileModel.findOne({ userId: user._id });
        if (hp?.profilePhoto) {
          userDto.profilePhoto = hp.profilePhoto;
          await UserModel.findByIdAndUpdate(user._id, { profilePhoto: hp.profilePhoto });
        }
      } catch {
        // Non-blocking
      }
    }

    return {
      user: userDto,
      ...tokens,
    };
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.sessionSvc.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionSvc.revokeSession(refreshToken);
  }

  async forgotPassword(
    dto: ForgotPasswordDto
  ): Promise<{ resetSessionId: string; message: string }> {
    const user = await this.authRepo.findByIdentifier(dto.identifier);

    // Anti-enumeration: If user does not exist, pretend it succeeded
    if (!user) {
      return {
        resetSessionId: 'generic-verification-pending',
        message: 'If an account matches the provided information, a verification code has been dispatched.',
      };
    }

    const { tokenRecordId } = await this.verificationSvc.issueOtp(
      user._id.toString(),
      user.email,
      'PASSWORD_RESET',
      'EMAIL'
    );

    return {
      resetSessionId: tokenRecordId,
      message: 'If an account matches the provided information, a verification code has been dispatched.',
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto): Promise<{ resetAuthToken: string }> {
    if (dto.resetSessionId === 'generic-verification-pending') {
      throw new AppError('Invalid or expired verification code', 400);
    }

    const { userId, purpose } = await this.verificationSvc.verifyOtpById(
      dto.resetSessionId,
      dto.otp
    );

    if (purpose !== 'PASSWORD_RESET') {
      throw new AppError('Invalid token purpose', 400);
    }

    // Issue short-lived reset authorization token (10 mins)
    const resetAuthToken = signResetToken({
      sub: userId,
      purpose: 'PASSWORD_RESET',
    });

    return { resetAuthToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let payload;
    try {
      payload = verifyResetToken(dto.resetAuthToken);
    } catch {
      throw new AppError('Password reset authorization token is invalid or expired. Please start over.', 401);
    }

    if (payload.purpose !== 'PASSWORD_RESET') {
      throw new AppError('Invalid reset token scope', 403);
    }

    const newPasswordHash = await hashPassword(dto.newPassword);
    const updated = await this.authRepo.updatePassword(payload.sub, newPasswordHash);

    if (!updated) {
      throw new AppError('User not found', 404);
    }

    // Invalidate all existing sessions for security
    await this.sessionSvc.revokeAllUserSessions(payload.sub);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.authRepo.findByIdPublic(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const userDto = this.mapToUserDto(user);
    if (!userDto.profilePhoto) {
      try {
        const hp = await HealthProfileModel.findOne({ userId });
        if (hp?.profilePhoto) {
          userDto.profilePhoto = hp.profilePhoto;
          await UserModel.findByIdAndUpdate(userId, { profilePhoto: hp.profilePhoto });
        }
      } catch {
        // Non-blocking
      }
    }
    return userDto;
  }
}

export const authService = new AuthService();

