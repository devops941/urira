package com.uyira.health.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.uyira.health.tracking.StepCalculator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Handles Midnight Rollovers and System Clock / Timezone Changes.
 * Resets the daily baseline reading at 00:00:00 so new day begins at 0 steps.
 */
class DateChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        val action = intent.action
        if (action == Intent.ACTION_DATE_CHANGED ||
            action == Intent.ACTION_TIME_SET ||
            action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            val calculator = StepCalculator(context)
            CoroutineScope(Dispatchers.IO).launch {
                calculator.handleMidnightRollover()
            }
        }
    }
}

