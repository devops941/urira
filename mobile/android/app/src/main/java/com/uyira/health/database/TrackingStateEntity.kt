package com.uyira.health.database

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * UYIRA Sensor Baseline & Reboot State Entity
 * Preserves hardware step counter baselines across app kills and phone reboots.
 */
@Entity(tableName = "tracking_state")
data class TrackingStateEntity(
    @PrimaryKey
    val id: Int = 1,
    val currentDate: String,
    val baselineReading: Float,
    val lastKnownReading: Float,
    val rebootOffset: Float,
    val lastBootTimestamp: Long
)

