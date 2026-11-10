package com.uyira.health.database

import androidx.room.*

/**
 * Data Access Object for UYIRA Step Tracking
 */
@Dao
interface StepDao {
    @Query("SELECT * FROM daily_steps WHERE dateString = :dateString LIMIT 1")
    suspend fun getStepByDate(dateString: String): StepEntity?

    @Query("SELECT * FROM daily_steps WHERE dateString BETWEEN :startDate AND :endDate ORDER BY dateString ASC")
    suspend fun getStepsBetweenDates(startDate: String, endDate: String): List<StepEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateStep(step: StepEntity)

    @Query("SELECT * FROM tracking_state WHERE id = 1 LIMIT 1")
    suspend fun getTrackingState(): TrackingStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveTrackingState(state: TrackingStateEntity)
}

