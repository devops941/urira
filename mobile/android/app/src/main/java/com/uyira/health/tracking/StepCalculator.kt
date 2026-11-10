package com.uyira.health.tracking

import android.content.Context
import com.uyira.health.database.StepDatabase
import com.uyira.health.database.StepEntity
import com.uyira.health.database.TrackingStateEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Industrial Step Calculation Engine
 * Implements: Daily Steps = (Current Sensor Value - Daily Baseline) + Reboot Offset
 * Guaranteed reboot-safe, midnight rollover compliant, and duplicate-free.
 */
class StepCalculator(private val context: Context) {
    private val db = StepDatabase.getDatabase(context)
    private val dao = db.stepDao()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    private fun getTodayString(): String = dateFormat.format(Date())

    suspend fun processSensorReading(rawCumulativeSteps: Float, heightCm: Int = 170, weightKg: Int = 70): StepResult = withContext(Dispatchers.IO) {
        val todayStr = getTodayString()
        val now = System.currentTimeMillis()

        var state = dao.getTrackingState()
        if (state == null) {
            // First run on device: establish today's baseline reading
            state = TrackingStateEntity(
                id = 1,
                currentDate = todayStr,
                baselineReading = rawCumulativeSteps,
                lastKnownReading = rawCumulativeSteps,
                rebootOffset = 0f,
                lastBootTimestamp = now
            )
            dao.saveTrackingState(state)
        }

        var baseline = state.baselineReading
        var offset = state.rebootOffset

        // 1. Midnight Rollover Check: Date has changed since last reading
        if (state.currentDate != todayStr) {
            baseline = rawCumulativeSteps
            offset = 0f
            state = state.copy(
                currentDate = todayStr,
                baselineReading = baseline,
                lastKnownReading = rawCumulativeSteps,
                rebootOffset = offset
            )
            dao.saveTrackingState(state)
        }

        // 2. Device Reboot Detection: Sensor value dropped below last known reading
        if (rawCumulativeSteps < state.lastKnownReading) {
            val stepsBeforeReboot = Math.max(0f, state.lastKnownReading - state.baselineReading)
            offset += stepsBeforeReboot
            baseline = rawCumulativeSteps // Reset baseline to new counter post-reboot
            state = state.copy(
                baselineReading = baseline,
                lastKnownReading = rawCumulativeSteps,
                rebootOffset = offset
            )
            dao.saveTrackingState(state)
        } else {
            // Normal progression: update last known reading
            state = state.copy(lastKnownReading = rawCumulativeSteps)
            dao.saveTrackingState(state)
        }

        // 3. True Daily Step Count Calculation
        val rawStepsToday = (rawCumulativeSteps - baseline) + offset
        val calculatedSteps = Math.max(0, Math.round(rawStepsToday))

        // 4. Biomechanical Distance & Caloric Formulas
        val strideMeters = (heightCm.toDouble() * 0.415) / 100.0
        val distanceMeters = calculatedSteps * strideMeters
        val durationSeconds = Math.round((calculatedSteps.toDouble() / 100.0) * 60.0)
        val calories = Math.max(0, Math.round(calculatedSteps.toDouble() * 0.045 * (weightKg.toDouble() / 70.0)).toInt())
        val goal = 8000
        val goalReached = calculatedSteps >= goal

        // 5. Upsert to Room Database
        val stepRecord = StepEntity(
            dateString = todayStr,
            steps = calculatedSteps,
            distanceMeters = distanceMeters,
            durationSeconds = durationSeconds,
            caloriesBurned = calories,
            goalReached = goalReached,
            lastUpdated = now,
            isSynced = false
        )
        dao.insertOrUpdateStep(stepRecord)

        StepResult(
            dateString = todayStr,
            steps = calculatedSteps,
            distanceMeters = distanceMeters,
            durationSeconds = durationSeconds,
            caloriesBurned = calories,
            goalReached = goalReached
        )
    }

    suspend fun getTodaySteps(): StepEntity? = withContext(Dispatchers.IO) {
        val todayStr = getTodayString()
        dao.getStepByDate(todayStr)
    }

    suspend fun handleMidnightRollover() = withContext(Dispatchers.IO) {
        val todayStr = getTodayString()
        val state = dao.getTrackingState()
        if (state != null && state.currentDate != todayStr) {
            val newState = state.copy(
                currentDate = todayStr,
                baselineReading = state.lastKnownReading,
                rebootOffset = 0f
            )
            dao.saveTrackingState(newState)
        }
    }
}

data class StepResult(
    val dateString: String,
    val steps: Int,
    val distanceMeters: Double,
    val durationSeconds: Long,
    val caloriesBurned: Int,
    val goalReached: Boolean
)

