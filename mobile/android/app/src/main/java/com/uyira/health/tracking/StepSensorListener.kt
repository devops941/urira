package com.uyira.health.tracking

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Hardware Sensor Listener
 * Listens strictly to Android's Sensor.TYPE_STEP_COUNTER.
 * Shaking, picking up the phone, or light hand movements are filtered out at the silicon hardware DSP level.
 */
class StepSensorListener(
    private val context: Context,
    private val onStepUpdate: (StepResult) -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val stepCounterSensor: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private val calculator = StepCalculator(context)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var isRegistered = false

    fun startListening(): Boolean {
        if (stepCounterSensor == null) {
            return false // Hardware step counter not present on this phone
        }
        if (!isRegistered) {
            // SENSOR_DELAY_UI provides fast responsiveness while maintaining low power consumption
            isRegistered = sensorManager.registerListener(
                this,
                stepCounterSensor,
                SensorManager.SENSOR_DELAY_UI
            )
        }
        return isRegistered
    }

    fun stopListening() {
        if (isRegistered) {
            sensorManager.unregisterListener(this)
            isRegistered = false
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        val rawSteps = event.values[0]
        if (rawSteps < 0) return

        scope.launch {
            val result = calculator.processSensorReading(rawSteps)
            onStepUpdate(result)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op for step counter sensor
    }

    fun hasSensor(): Boolean = stepCounterSensor != null
}

