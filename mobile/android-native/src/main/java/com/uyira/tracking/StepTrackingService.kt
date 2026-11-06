package com.uyira.tracking

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class StepTrackingService : Service(), SensorEventListener {

    private val sensorManager by lazy { getSystemService(Context.SENSOR_SERVICE) as SensorManager }
    private val stepSensor by lazy { sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) }

    private var initialStepBaseline: Long = -1L
    private var currentSessionSteps: Long = 0L
    private var isTracking = false
    private var isPaused = false

    companion object {
        const val CHANNEL_ID = "uyira_step_tracker_channel"
        const val NOTIFICATION_ID = 8801
        const val ACTION_START = "ACTION_START"
        const val ACTION_PAUSE = "ACTION_PAUSE"
        const val ACTION_RESUME = "ACTION_RESUME"
        const val ACTION_STOP = "ACTION_STOP"
        const val BROADCAST_STEP_UPDATE = "com.uyira.tracking.STEP_UPDATE"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startTracking()
            ACTION_PAUSE -> pauseTracking()
            ACTION_RESUME -> resumeTracking()
            ACTION_STOP -> stopTracking()
        }
        return START_STICKY
    }

    private fun startTracking() {
        if (isTracking) return
        isTracking = true
        isPaused = false
        initialStepBaseline = -1L
        currentSessionSteps = 0L

        // Register hardware step sensor
        stepSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }

        // Start Foreground Service with Android 14+ Health service type
        val notification = buildNotification(0L)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun pauseTracking() {
        isPaused = true
        updateNotification(currentSessionSteps, "Workout Paused")
    }

    private fun resumeTracking() {
        isPaused = false
        updateNotification(currentSessionSteps, "Workout Active")
    }

    private fun stopTracking() {
        isTracking = false
        isPaused = false
        sensorManager.unregisterListener(this)
        stopForeground(true)
        stopSelf()
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_STEP_COUNTER && isTracking && !isPaused) {
            val totalStepsSinceBoot = event.values[0].toLong()

            if (initialStepBaseline < 0) {
                initialStepBaseline = totalStepsSinceBoot
            }

            // Calculate session steps accurately subtracting boot baseline
            currentSessionSteps = maxOf(0L, totalStepsSinceBoot - initialStepBaseline)

            // Update persistent foreground notification
            updateNotification(currentSessionSteps, "Walking Session Active")

            // Broadcast to React Native Bridge
            val broadcastIntent = Intent(BROADCAST_STEP_UPDATE).apply {
                putExtra("steps", currentSessionSteps)
            }
            sendBroadcast(broadcastIntent)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "UYIRA Walking Tracker",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Live walking steps and workout notifications"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(steps: Long, status: String = "Walking Session Active"): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("UYIRA — Active Walk")
            .setContentText("$steps steps • $status")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun updateNotification(steps: Long, status: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(steps, status))
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

