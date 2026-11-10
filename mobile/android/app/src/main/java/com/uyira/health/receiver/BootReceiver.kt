package com.uyira.health.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.uyira.health.tracking.StepTrackingService

/**
 * Automatically resumes UYIRA Step Tracking Service when the smartphone finishes rebooting.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            StepTrackingService.startService(context)
        }
    }
}

