package com.uyira.health.bridge

import android.content.Context
import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.uyira.health.database.StepDatabase
import com.uyira.health.tracking.StepCalculator
import com.uyira.health.tracking.StepTrackingService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * React Native Kotlin NativeModule Bridge for UYIRA Step Tracking.
 * Directly links React Native UI with the Kotlin Foreground Service and Room Database.
 */
class StepCounterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val db = StepDatabase.getDatabase(reactContext)
    private val dao = db.stepDao()
    private val calculator = StepCalculator(reactContext)

    companion object {
        const val MODULE_NAME = "StepCounterModule"
        const val EVENT_ON_STEP_CHANGE = "onStepChange"

        private var reactContextInstance: ReactApplicationContext? = null

        fun emitStepEvent(
            steps: Int,
            distanceMeters: Double,
            durationSeconds: Long,
            caloriesBurned: Int,
            dateString: String
        ) {
            val context = reactContextInstance ?: return
            if (!context.hasActiveReactInstance()) return

            val params = Arguments.createMap().apply {
                putInt("steps", steps)
                putDouble("distanceMeters", distanceMeters)
                putDouble("durationSeconds", durationSeconds.toDouble())
                putInt("caloriesBurned", caloriesBurned)
                putString("dateString", dateString)
                putString("sensorSource", "HARDWARE_STEP_COUNTER")
            }

            try {
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(EVENT_ON_STEP_CHANGE, params)
            } catch (e: Exception) {
                // React context may be transitioning
            }
        }
    }

    init {
        reactContextInstance = reactContext
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun hasStepCounterSensor(promise: Promise) {
        val hasSensor = reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_SENSOR_STEP_COUNTER)
        promise.resolve(hasSensor)
    }

    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            StepTrackingService.startService(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_TRACKING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            StepTrackingService.stopService(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_TRACKING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getTodaySteps(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val record = calculator.getTodaySteps()
                val map = Arguments.createMap().apply {
                    putInt("steps", record?.steps ?: 0)
                    putDouble("distanceMeters", record?.distanceMeters ?: 0.0)
                    putDouble("durationSeconds", (record?.durationSeconds ?: 0L).toDouble())
                    putInt("caloriesBurned", record?.caloriesBurned ?: 0)
                    putString("dateString", record?.dateString ?: "")
                    putBoolean("goalReached", record?.goalReached ?: false)
                    putString("sensorSource", "HARDWARE_STEP_COUNTER")
                }
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("GET_TODAY_STEPS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getHistoricalSteps(startDate: String, endDate: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val records = dao.getStepsBetweenDates(startDate, endDate)
                val array = Arguments.createArray()
                for (r in records) {
                    val map = Arguments.createMap().apply {
                        putString("dateString", r.dateString)
                        putInt("steps", r.steps)
                        putDouble("distanceMeters", r.distanceMeters)
                        putDouble("durationSeconds", r.durationSeconds.toDouble())
                        putInt("caloriesBurned", r.caloriesBurned)
                        putBoolean("goalReached", r.goalReached)
                    }
                    array.pushMap(map)
                }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("GET_HISTORY_ERROR", e.message, e)
            }
        }
    }

    // Required for React Native EventEmitter compatibility
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

