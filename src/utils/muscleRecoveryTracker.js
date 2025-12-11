import { MUSCLE_GROUP_LIMITS } from '../data/muscleGroupLimits';

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
 * Get day name from date
 */
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

/**
 * Get the next available workout day name
 */
function getNextWorkoutDay(lastWorkoutDate, recoveryDays) {
  const lastDate = new Date(lastWorkoutDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + recoveryDays);
  return getDayName(nextDate);
}

/**
 * Check if muscle should show red notification dot
 * Returns true if muscle is still in recovery period
 */
export function shouldShowRedDot(muscleKey, workoutData) {
  const limits = MUSCLE_GROUP_LIMITS[muscleKey];
  if (!limits) return false;

  const lastWorkout = getLastWorkoutDate(muscleKey, workoutData);
  if (!lastWorkout) return false;

  const today = new Date();
  const daysSinceLastWorkout = getDaysDifference(lastWorkout, today);

  // Show red dot if still within recovery period
  return daysSinceLastWorkout < limits.restDays;
}

/**
 * Get the last workout date for a specific muscle
 */
export function getLastWorkoutDate(muscleKey, workoutData) {
  if (!workoutData || !Array.isArray(workoutData)) return null;

  let lastDate = null;

  workoutData.forEach(day => {
    if (!day.exercises || !Array.isArray(day.exercises)) return;

    const hasMuscleTrained = day.exercises.some(exercise => {
      if (exercise.category === 'cardio' && muscleKey === 'cardio') {
        return true;
      }

      const primary = Array.isArray(exercise.muscles?.primary)
        ? exercise.muscles.primary
        : [];
      const secondary = Array.isArray(exercise.muscles?.secondary)
        ? exercise.muscles.secondary
        : [];

      const allMuscles = [...primary, ...secondary].map(m => 
        m.toLowerCase().trim()
      );

      return allMuscles.includes(muscleKey);
    });

    if (hasMuscleTrained) {
      const workoutDate = new Date(day.date);
      if (!lastDate || workoutDate > lastDate) {
        lastDate = workoutDate;
      }
    }
  });

  return lastDate;
}

/**
 * Get workout count for a specific muscle on a specific date
 */
export function getWorkoutCountForDate(muscleKey, targetDate, workoutData) {
  if (!workoutData || !Array.isArray(workoutData)) return 0;

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  let count = 0;

  workoutData.forEach(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    // Check if same date
    if (dayDate.getTime() !== target.getTime()) return;

    if (!day.exercises || !Array.isArray(day.exercises)) return;

    day.exercises.forEach(exercise => {
      if (exercise.category === 'cardio' && muscleKey === 'cardio') {
        count++;
        return;
      }

      const primary = Array.isArray(exercise.muscles?.primary)
        ? exercise.muscles.primary
        : [];
      const secondary = Array.isArray(exercise.muscles?.secondary)
        ? exercise.muscles.secondary
        : [];

      const allMuscles = [...primary, ...secondary].map(m => 
        m.toLowerCase().trim()
      );

      if (allMuscles.includes(muscleKey)) {
        count++;
      }
    });
  });

  return count;
}

/**
 * Get muscle recovery info for display in modal
 */
export function getMuscleRecoveryInfo(muscleKey, selectedDate, workoutData) {
  const limits = MUSCLE_GROUP_LIMITS[muscleKey];
  if (!limits) {
    return {
      muscleName: muscleKey,
      workoutsToday: 0,
      nextWorkoutDay: 'Unknown',
      isRecovering: false
    };
  }

  const workoutsToday = getWorkoutCountForDate(muscleKey, selectedDate, workoutData);
  const lastWorkout = getLastWorkoutDate(muscleKey, workoutData);
  
  let nextWorkoutDay = 'Ready';
  let isRecovering = false;

  if (lastWorkout) {
    const today = new Date();
    const daysSinceLastWorkout = getDaysDifference(lastWorkout, today);

    if (daysSinceLastWorkout < limits.restDays) {
      isRecovering = true;
      nextWorkoutDay = getNextWorkoutDay(lastWorkout, limits.restDays);
    }
  }

  return {
    muscleName: limits.displayName,
    workoutsToday,
    nextWorkoutDay,
    isRecovering,
    restDays: limits.restDays,
    lastWorkoutDate: lastWorkout
  };
}

/**
 * Get all muscles that should show red dots (for current view)
 */
export function getMusclesWithRedDots(workoutData) {
  const musclesWithDots = {};

  Object.keys(MUSCLE_GROUP_LIMITS).forEach(muscleKey => {
    musclesWithDots[muscleKey] = shouldShowRedDot(muscleKey, workoutData);
  });

  return musclesWithDots;
}
