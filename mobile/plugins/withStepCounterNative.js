const { withAndroidManifest, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * UYIRA Expo Config Plugin for Native Step Counter & Foreground Service
 * Injects Manifest declarations, Room database dependencies, and Kotlin packages.
 */
function withStepCounterNative(config) {
  // 1. AndroidManifest.xml Modifications
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    // Ensure permissions array exists
    if (!config.modResults.manifest['uses-permission']) {
      config.modResults.manifest['uses-permission'] = [];
    }
    const permissions = config.modResults.manifest['uses-permission'];

    const requiredPermissions = [
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_HEALTH',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
      'android.permission.POST_NOTIFICATIONS',
    ];

    requiredPermissions.forEach((permName) => {
      if (!permissions.some((p) => p.$?.['android:name'] === permName)) {
        permissions.push({
          $: { 'android:name': permName },
        });
      }
    });

    // Ensure service declarations exist
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceName = 'com.uyira.health.tracking.StepTrackingService';
    if (!mainApplication.service.some((s) => s.$?.['android:name'] === serviceName)) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'false',
          'android:foregroundServiceType': 'health',
        },
      });
    }

    // Ensure receiver declarations exist
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const bootReceiver = 'com.uyira.health.receiver.BootReceiver';
    if (!mainApplication.receiver.some((r) => r.$?.['android:name'] === bootReceiver)) {
      mainApplication.receiver.push({
        $: {
          'android:name': bootReceiver,
          'android:exported': 'false',
          'android:enabled': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
            ],
          },
        ],
      });
    }

    const dateChangeReceiver = 'com.uyira.health.receiver.DateChangeReceiver';
    if (!mainApplication.receiver.some((r) => r.$?.['android:name'] === dateChangeReceiver)) {
      mainApplication.receiver.push({
        $: {
          'android:name': dateChangeReceiver,
          'android:exported': 'false',
          'android:enabled': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.DATE_CHANGED' } },
              { $: { 'android:name': 'android.intent.action.TIME_SET' } },
              { $: { 'android:name': 'android.intent.action.TIMEZONE_CHANGED' } },
            ],
          },
        ],
      });
    }

    return config;
  });

  // 2. build.gradle Modifications (Room DB & Kapt)
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("apply plugin: 'kotlin-kapt'")) {
      contents = `apply plugin: 'kotlin-kapt'\n` + contents;
    }

    const roomDeps = `
    // Room Database for UYIRA Step Tracking
    def room_version = "2.6.1"
    implementation "androidx.room:room-runtime:$room_version"
    implementation "androidx.room:room-ktx:$room_version"
    kapt "androidx.room:room-compiler:$room_version"
    `;

    if (!contents.includes('androidx.room:room-runtime')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n${roomDeps}`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withStepCounterNative, 'withStepCounterNative', '1.0.0');

