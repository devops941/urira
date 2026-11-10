package com.uyira.health.database

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * UYIRA Daily Step Record Entity
 * Stores verified footsteps per calendar day (YYYY-MM-DD).
 */
@Entity(tableName = "daily_steps")
data class StepEntity(
    @PrimaryKey
    val dateString: String,
    val steps: Int,
    val distanceMeters: Double,
    val durationSeconds: Long,
    val caloriesBurned: Int,
    val goalReached: Boolean,
    val lastUpdated: Long,
    val isSynced: Boolean = false
)

