import { MUSCLE_GROUP_LIMITS, formatRestTime } from '../data/muscleGroupLimits';

/**
 * Calculate days between two dates (ignoring time)
 */
function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Reset time to midnight for accurate day calculation
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Analyzes recovery status for a specific muscle group based on workout history
 * @param {Array} workoutHistory - Array of workout objects with date and exercises
 * @param {string} muscleGroup - Muscle group to analyze (e.g., 'chest', 'biceps')
 * @returns {Object} Recovery status with status, message, and additional info
 */
export function analyzeRecovery(workoutHistory, muscleGroup) {
  const now = new Date();
  const normalizedMuscle = muscleGroup.toLowerCase().trim();
  const limits = MUSCLE_GROUP_LIMITS[normalizedMuscle];

  if (!limits) {
    return { 
      status: 'unknown', 
      message: 'Unknown muscle group',
      muscleGroup: normalizedMuscle
    };
  }

  // Filter workouts that trained this muscle group
  const relevantWorkouts = workoutHistory
    .filter(workout => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) return false;
      
      return workout.exercises.some(exercise => {
        if (!exercise.muscleGroups || !Array.isArray(exercise.muscleGroups)) return false;
        return exercise.muscleGroups.some(mg => 
          mg.toLowerCase().trim() === normalizedMuscle
        );
      });
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

  // No workout history for this muscle
  if (relevantWorkouts.length === 0) {
    return {
      status: 'ready',
      message: `✅ ${limits.displayName} ready to train`,
      muscleGroup: normalizedMuscle,
      lastWorkout: null,
      daysUntilReady: 0,
      weeklyCount: 0
    };
  }

  const lastWorkout = relevantWorkouts[0];
  const daysSinceLastWorkout = getDaysDifference(lastWorkout.date, now);

  // Check if muscle needs more rest
  if (daysSinceLastWorkout < limits.restDays) {
    const daysRemaining = limits.restDays - daysSinceLastWorkout;
    return {
      status: 'recovering',
      message: `⏳ ${limits.displayName} recovering - ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} rest needed`,
      muscleGroup: normalizedMuscle,
      lastWorkout: lastWorkout.date,
      daysUntilReady: daysRemaining,
      daysElapsed: daysSinceLastWorkout,
      totalRestNeeded: limits.restDays,
      weeklyCount: 0
    };
  }

  // Check weekly frequency (last 7 days)
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thisWeekWorkouts = relevantWorkouts.filter(w => 
    new Date(w.date) > sevenDaysAgo
  );

  if (thisWeekWorkouts.length >= limits.maxPerWeek) {
    return {
      status: 'overtraining',
      message: `🛑 ${limits.displayName} overtrained - ${thisWeekWorkouts.length}× this week (max ${limits.maxPerWeek}×)`,
      muscleGroup: normalizedMuscle,
      lastWorkout: lastWorkout.date,
      daysUntilReady: 0,
      weeklyCount: thisWeekWorkouts.length,
      maxWeekly: limits.maxPerWeek
    };
  }

  // Muscle is ready to train
  return {
    status: 'ready',
    message: `✅ ${limits.displayName} ready to train`,
    muscleGroup: normalizedMuscle,
    lastWorkout: lastWorkout.date,
    daysUntilReady: 0,
    weeklyCount: thisWeekWorkouts.length,
    maxWeekly: limits.maxPerWeek
  };
}

/**
 * Analyzes all muscle groups and returns recovery status
 * @param {Array} workoutHistory - Array of workout objects
 * @returns {Object} Recovery status for all muscle groups
 */
export function analyzeAllMuscles(workoutHistory) {
  const results = {};
  
  Object.keys(MUSCLE_GROUP_LIMITS).forEach(muscle => {
    results[muscle] = analyzeRecovery(workoutHistory, muscle);
  });

  return results;
}

/**
 * Validates if a workout plan respects recovery guidelines
 * @param {Array} exercises - Array of exercises to validate
 * @param {Array} workoutHistory - User's workout history
 * @returns {Object} Validation result with warnings array
 */
export function validateWorkoutPlan(exercises, workoutHistory) {
  const warnings = [];
  const muscleGroupsInWorkout = new Set();

  // Collect all muscle groups from the planned workout
  exercises.forEach(exercise => {
    if (exercise.muscleGroups && Array.isArray(exercise.muscleGroups)) {
      exercise.muscleGroups.forEach(mg => {
        muscleGroupsInWorkout.add(mg.toLowerCase().trim());
      });
    }
  });

  // Check recovery status for each muscle group
  muscleGroupsInWorkout.forEach(muscle => {
    const recovery = analyzeRecovery(workoutHistory, muscle);
    
    if (recovery.status === 'recovering') {
      warnings.push({
        type: 'rest',
        severity: 'warning',
        muscle: recovery.muscleGroup,
        message: recovery.message,
        daysNeeded: recovery.daysUntilReady
      });
    } else if (recovery.status === 'overtraining') {
      warnings.push({
        type: 'frequency',
        severity: 'danger',
        muscle: recovery.muscleGroup,
        message: recovery.message,
        weeklyCount: recovery.weeklyCount
      });
    }
  });

  return {
    valid: warnings.length === 0,
    warnings: warnings,
    muscleGroups: Array.from(muscleGroupsInWorkout)
  };
}

/**
 * Get recovery color for visual indicators
 * @param {string} status - Recovery status ('ready', 'recovering', 'overtraining')
 * @returns {string} Color hex code
 */
export function getRecoveryColor(status) {
  const colors = {
    ready: '#10b981',      // Green
    recovering: '#f59e0b', // Orange/Yellow
    overtraining: '#dc2626', // Red
    unknown: '#6b7280'     // Gray
  };
  
  return colors[status] || colors.unknown;
}

/**
 * Get recovery intensity (0-1 scale for opacity/heatmap)
 * @param {Object} recoveryStatus - Recovery status object from analyzeRecovery
 * @returns {number} Intensity between 0 and 1
 */
export function getRecoveryIntensity(recoveryStatus) {
  if (recoveryStatus.status === 'ready') return 0.3; // Low intensity - ready to train
  if (recoveryStatus.status === 'recovering') {
    // Calculate based on how much recovery is left
    const progress = 1 - (recoveryStatus.daysUntilReady / recoveryStatus.totalRestNeeded);
    return 0.3 + (progress * 0.4); // 0.3 to 0.7 range
  }
  if (recoveryStatus.status === 'overtraining') return 1.0; // Max intensity - danger
  return 0.1;
}

/**
 * Format recovery information for AI context
 * @param {Array} workoutHistory - User's workout history
 * @returns {string} Formatted string for AI prompts
 */
export function formatRecoveryForAI(workoutHistory) {
  const analysis = analyzeAllMuscles(workoutHistory);
  
  let output = 'MUSCLE RECOVERY STATUS:\n';
  
  Object.entries(analysis).forEach(([muscle, status]) => {
    const limits = MUSCLE_GROUP_LIMITS[muscle];
    if (status.status === 'recovering') {
      output += `- ${limits.displayName}: RECOVERING (${status.daysUntilReady} day${status.daysUntilReady > 1 ? 's' : ''} rest needed)\n`;
    } else if (status.status === 'overtraining') {
      output += `- ${limits.displayName}: OVERTRAINED (${status.weeklyCount}×/${limits.maxPerWeek}× this week)\n`;
    } else if (status.weeklyCount > 0) {
      output += `- ${limits.displayName}: Ready (${status.weeklyCount}×/${limits.maxPerWeek}× this week)\n`;
    }
  });
  
  return output;
}
