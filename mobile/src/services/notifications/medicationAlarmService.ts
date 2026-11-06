import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { secureStorage } from '../../utils/secureStorage';

// Safely configure notification handler for foreground notifications
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (err: any) {
  console.warn('Could not set notification handler:', err?.message);
}

const REMINDER_CHANNEL_ID = 'medication-reminders';
const ALARM_CHANNEL_ID = 'medication-alarms';
const STORAGE_PREFIX = 'uyira_med_notif_';

// Audio asset provided by the user
const alarmSoundAsset = require('../../../assets/audio/alaram.wav');

let isAlarmVibrating = false;
let activeAudioPlayer: any = null;

export const medicationAlarmService = {
  /**
   * Initialize notification channels and permissions
   */
  async init(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;

      // 1. Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // 2. Setup Android Notification Channels
      if (Platform.OS === 'android') {
        // High importance notification channel (Heads-up popup banner)
        await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
          name: 'Medication Reminders',
          description: 'Regular popup notifications for scheduled medication doses',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#12372A',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Max importance channel for loud alarms with custom alaram.wav sound
        await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
          name: 'Medication Alarms (Loud)',
          description: 'High-priority alert with sound and vibration for critical medication',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'alaram.wav',
          vibrationPattern: [0, 500, 250, 500, 250, 500],
          lightColor: '#EF4444',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          },
        });
      }

      return true;
    } catch (err: any) {
      console.warn('Failed to initialize medication notification channels:', err?.message);
      return false;
    }
  },

  /**
   * Request permissions directly
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Schedule recurring daily notifications and alarms for a medication
   */
  async scheduleMedicationDoses(medication: {
    id: string;
    name: string;
    dosage?: string;
    strength?: string;
    instructions?: string;
    foodInstruction?: string;
    scheduledTimes: string[];
    alarmEnabled?: boolean;
  }): Promise<string[]> {
    if (Platform.OS === 'web') return [];

    await this.init();

    // Cancel existing scheduled notifications for this medicine first
    await this.cancelMedicationDoses(medication.id);

    const scheduledIds: string[] = [];
    const doseDesc = medication.dosage || medication.strength || '1 dose';
    const foodDesc = (medication.foodInstruction || medication.instructions || 'Anytime').replace(/_/g, ' ');
    const isAlarm = !!medication.alarmEnabled;

    for (const timeStr of medication.scheduledTimes) {
      const parts = timeStr.trim().split(':');
      if (parts.length < 2) continue;

      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);

      if (isNaN(hour) || isNaN(minute)) continue;

      try {
        const notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: isAlarm ? `⏰ ALARM: Time for ${medication.name}` : `💊 Medication Reminder: ${medication.name}`,
            body: `Take ${doseDesc} (${foodDesc}) scheduled at ${timeStr}. Tap to open.`,
            sound: isAlarm ? 'alaram.wav' : true,
            priority: isAlarm
              ? Notifications.AndroidNotificationPriority.MAX
              : Notifications.AndroidNotificationPriority.HIGH,
            data: {
              type: 'MEDICATION_REMINDER',
              medicationId: medication.id,
              name: medication.name,
              dosage: doseDesc,
              foodInstruction: foodDesc,
              scheduledTime: timeStr,
              isAlarm,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId: isAlarm ? ALARM_CHANNEL_ID : REMINDER_CHANNEL_ID,
            hour,
            minute,
          },
        });

        scheduledIds.push(notifId);
      } catch (err: any) {
        console.warn(`Failed to schedule notification for ${medication.name} at ${timeStr}:`, err?.message);
      }
    }

    // Save scheduled IDs in secure storage
    if (scheduledIds.length > 0) {
      await secureStorage.setItem(`${STORAGE_PREFIX}${medication.id}`, JSON.stringify(scheduledIds));
    }

    return scheduledIds;
  },

  /**
   * Cancel scheduled reminders when a medication is deleted or deactivated
   */
  async cancelMedicationDoses(medicationId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const stored = await secureStorage.getItem(`${STORAGE_PREFIX}${medicationId}`);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        await secureStorage.removeItem(`${STORAGE_PREFIX}${medicationId}`);
      }
    } catch (err: any) {
      console.warn(`Failed to cancel medication doses for ${medicationId}:`, err?.message);
    }
  },

  /**
   * Snooze a dose by scheduling an exact reminder after X minutes (default 15 mins)
   */
  async snoozeDose(medication: {
    medicationId: string;
    name: string;
    dosage?: string;
    foodInstruction?: string;
    scheduledTime?: string;
  }, minutes: number = 15): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      this.stopAlarmSound();

      const triggerDate = new Date(Date.now() + minutes * 60 * 1000);
      const targetTimeStr =
        medication.scheduledTime ||
        `${triggerDate.getHours().toString().padStart(2, '0')}:${triggerDate.getMinutes().toString().padStart(2, '0')}`;

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ SNOOZED (15m): Time for ${medication.name}`,
          body: `Reminder: Please take ${medication.dosage || 'your dose'} (${medication.foodInstruction || 'Anytime'}).`,
          sound: 'alaram.wav',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            type: 'MEDICATION_REMINDER',
            medicationId: medication.medicationId,
            name: medication.name,
            dosage: medication.dosage,
            foodInstruction: medication.foodInstruction,
            scheduledTime: targetTimeStr,
            isAlarm: true,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: ALARM_CHANNEL_ID,
        },
      });

      return notifId;
    } catch (err: any) {
      console.warn('Failed to snooze dose:', err?.message);
      return null;
    }
  },

  /**
   * Play continuous custom alarm audio (alaram.wav) + vibration pattern until user acknowledges
   */
  async playAlarmSound(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      // Start continuous vibration pattern
      if (!isAlarmVibrating) {
        isAlarmVibrating = true;
        Vibration.vibrate([0, 800, 400, 800, 400, 800], true);
      }

      // Play custom alaram.wav audio on loop
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });

        if (!activeAudioPlayer) {
          activeAudioPlayer = createAudioPlayer(alarmSoundAsset);
          activeAudioPlayer.loop = true;
          activeAudioPlayer.volume = 1.0;
        }

        activeAudioPlayer.play();
      } catch (audioErr: any) {
        console.warn('In-app audio playback via expo-audio failed (vibration active):', audioErr?.message);
      }
    } catch (err: any) {
      console.warn('Error starting alarm sound:', err?.message);
    }
  },

  /**
   * Stop active alarm sound and vibration
   */
  stopAlarmSound(): void {
    try {
      isAlarmVibrating = false;
      Vibration.cancel();

      if (activeAudioPlayer) {
        try {
          activeAudioPlayer.pause();
          activeAudioPlayer.release();
        } catch {}
        activeAudioPlayer = null;
      }
    } catch (err: any) {
      console.warn('Error stopping alarm sound:', err?.message);
    }
  },
};
