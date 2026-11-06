package com.uyira.tracking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class StepTrackerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val sensorManager by lazy {
        reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    }

    private var stepReceiver: BroadcastReceiver? = null

    init {
        registerStepBroadcastReceiver()
    }

    override fun getName(): String = "StepTracker"

    @ReactMethod
    fun hasStepCounterSensor(promise: Promise) {
        val hasSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
        promise.resolve(hasSensor)
    }

    @ReactMethod
    fun startTracking(promise: Promise) {
        val context = reactApplicationContext
        val intent = Intent(context, StepTrackingService::class.java).apply {
            action = StepTrackingService.ACTION_START
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun pauseTracking(promise: Promise) {
        val context = reactApplicationContext
        val intent = Intent(context, StepTrackingService::class.java).apply {
            action = StepTrackingService.ACTION_PAUSE
        }
        context.startService(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun resumeTracking(promise: Promise) {
        val context = reactApplicationContext
        val intent = Intent(context, StepTrackingService::class.java).apply {
            action = StepTrackingService.ACTION_RESUME
        }
        context.startService(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        val context = reactApplicationContext
        val intent = Intent(context, StepTrackingService::class.java).apply {
            action = StepTrackingService.ACTION_STOP
        }
        context.startService(intent)
        promise.resolve(true)
    }

    private fun registerStepBroadcastReceiver() {
        stepReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == StepTrackingService.BROADCAST_STEP_UPDATE) {
                    val steps = intent.getLongExtra("steps", 0L)
                    val params = Arguments.createMap().apply {
                        putDouble("steps", steps.toDouble())
                    }
                    sendEvent("onStepUpdate", params)
                }
            }
        }
        val filter = IntentFilter(StepTrackingService.BROADCAST_STEP_UPDATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.registerReceiver(
                stepReceiver,
                filter,
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            reactApplicationContext.registerReceiver(stepReceiver, filter)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

