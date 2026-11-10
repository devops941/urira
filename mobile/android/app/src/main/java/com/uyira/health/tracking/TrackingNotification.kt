package com.uyira.health.tracking

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Manages the Persistent Low-Priority Notification for UYIRA Step Tracking.
 * Compliant with Android 8.0+ channels and Android 14+ Foreground Service Health type.
 */
object TrackingNotification {
    const val CHANNEL_ID = "uyira_step_tracking_channel"
    const val NOTIFICATION_ID = 9001

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "UYIRA Step Tracker"
            val descriptionText = "Displays live step progress while tracking footsteps in the background"
            val importance = NotificationManager.IMPORTANCE_LOW // Silent, no sound
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
                enableVibration(false)
                enableLights(false)
            }
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun buildNotification(context: Context, steps: Int, goal: Int = 8000): Notification {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val progress = if (goal > 0) Math.min((steps * 100) / goal, 100) else 0

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("UYIRA Smart Step Tracker")
            .setContentText("%,d steps walked today ($progress% of daily goal)".format(steps))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}

