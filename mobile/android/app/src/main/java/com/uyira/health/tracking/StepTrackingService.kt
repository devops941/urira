package com.uyira.health.tracking

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import com.uyira.health.bridge.StepCounterModule

/**
 * UYIRA Native Android Foreground Service for Continuous Step Tracking.
 * Certified for Android 14+ Foreground Service Health type.
 * Runs continuously when screen is locked, app is minimized, or other apps are open.
 */
class StepTrackingService : Service() {

    private var sensorListener: StepSensorListener? = null
    private var notificationManager: NotificationManager? = null

    companion object {
        const val ACTION_START = "com.uyira.health.action.START_TRACKING"
        const val ACTION_STOP = "com.uyira.health.action.STOP_TRACKING"

        fun startService(context: Context) {
            val intent = Intent(context, StepTrackingService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, StepTrackingService::class.java).apply {
                action = ACTION_STOP
            }
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        TrackingNotification.createNotificationChannel(this)

        sensorListener = StepSensorListener(this) { result ->
            // 1. Update Persistent Notification with current steps
            val notification = TrackingNotification.buildNotification(this, result.steps)
            notificationManager?.notify(TrackingNotification.NOTIFICATION_ID, notification)

            // 2. Broadcast Live Update to React Native UI
            StepCounterModule.emitStepEvent(
                steps = result.steps,
                distanceMeters = result.distanceMeters,
                durationSeconds = result.durationSeconds,
                caloriesBurned = result.caloriesBurned,
                dateString = result.dateString
            )
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        // Start Foreground Notification
        val initialNotification = TrackingNotification.buildNotification(this, 0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ requires explicit health type
            startForeground(
                TrackingNotification.NOTIFICATION_ID,
                initialNotification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
            )
        } else {
            startForeground(TrackingNotification.NOTIFICATION_ID, initialNotification)
        }

        sensorListener?.startListening()

        // START_STICKY ensures Android automatically restarts the service if process is reclaimed
        return START_STICKY
    }

    private fun stopForegroundService() {
        sensorListener?.stopListening()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        sensorListener?.stopListening()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

