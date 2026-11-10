import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { StepCounterModule } = NativeModules;

export interface NativeStepEvent {
  steps: number;
  distanceMeters: number;
  durationSeconds: number;
  caloriesBurned: number;
  dateString: string;
  sensorSource: 'HARDWARE_STEP_COUNTER' | 'SOFTWARE_FALLBACK';
}

const eventEmitter =
  Platform.OS === 'android' && StepCounterModule
    ? new NativeEventEmitter(StepCounterModule)
    : null;

/**
 * React Native Bridge for UYIRA Kotlin Native Step Counter & Foreground Service
 */
export const stepTrackingNativeBridge = {
  /**
   * Check if the device has the native Kotlin StepCounterModule available
   */
  isNativeModuleAvailable(): boolean {
    return Platform.OS === 'android' && !!StepCounterModule;
  },

  /**
   * Check if the device hardware supports Sensor.TYPE_STEP_COUNTER
   */
  async hasHardwareStepSensor(): Promise<boolean> {
    if (!this.isNativeModuleAvailable()) return false;
    try {
      return await StepCounterModule.hasStepCounterSensor();
    } catch {
      return false;
    }
  },

  /**
   * Start the Native Android Foreground Service for locked-screen tracking
   */
  async startTracking(): Promise<boolean> {
    if (!this.isNativeModuleAvailable()) return false;
    try {
      return await StepCounterModule.startTracking();
    } catch (err) {
      console.warn('Native startTracking failed:', err);
      return false;
    }
  },

  /**
   * Stop the Native Android Foreground Service
   */
  async stopTracking(): Promise<boolean> {
    if (!this.isNativeModuleAvailable()) return false;
    try {
      return await StepCounterModule.stopTracking();
    } catch (err) {
      console.warn('Native stopTracking failed:', err);
      return false;
    }
  },

  /**
   * Retrieve today's cumulative step count directly from the Room Database
   */
  async getTodaySteps(): Promise<NativeStepEvent | null> {
    if (!this.isNativeModuleAvailable()) return null;
    try {
      return await StepCounterModule.getTodaySteps();
    } catch (err) {
      console.warn('Native getTodaySteps failed:', err);
      return null;
    }
  },

  /**
   * Retrieve historical step records from the Room Database
   */
  async getHistoricalSteps(
    startDate: string,
    endDate: string
  ): Promise<NativeStepEvent[]> {
    if (!this.isNativeModuleAvailable()) return [];
    try {
      return await StepCounterModule.getHistoricalSteps(startDate, endDate);
    } catch (err) {
      console.warn('Native getHistoricalSteps failed:', err);
      return [];
    }
  },

  /**
   * Subscribe to live verified footsteps emitted by the hardware sensor
   */
  subscribeToStepEvents(callback: (event: NativeStepEvent) => void): () => void {
    if (!eventEmitter || !this.isNativeModuleAvailable()) {
      return () => {};
    }

    const subscription = eventEmitter.addListener('onStepChange', (data: any) => {
      callback(data as NativeStepEvent);
    });
    return () => {
      subscription.remove();
    };
  },
};
