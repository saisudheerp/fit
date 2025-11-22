/**
 * Hybrid Calorie Calculation Engine
 * Uses MET-based time calculation + volume-based strength calculation
 */

/**
 * Calculate time-based calories using MET formula
 * @param {number} met - Metabolic Equivalent of Task
 * @param {number} bodyWeightKg - User's body weight in kg
 * @param {number} durationMinutes - Exercise duration in minutes
 * @returns {number} Calories burned from time
 */
export function calculateCaloriesTime(met, bodyWeightKg, durationMinutes) {
  return (met * 3.5 * bodyWeightKg / 200) * durationMinutes;
}

/**
 * Calculate volume-based calories for strength exercises
 * @param {number} weightKg - Weight lifted in kg
 * @param {number} reps - Number of repetitions
 * @param {number} sets - Number of sets
 * @param {number} volumeCoefficient - Exercise-specific coefficient (0.05-0.14)
 * @returns {number} Calories burned from volume
 */
export function calculateCaloriesVolume(weightKg, reps, sets, volumeCoefficient) {
  const volume = weightKg * reps * sets;
  return volume * volumeCoefficient;
}

/**
 * Calculate total calories for strength exercises
 * Combines time-based and volume-based calculations
 * @param {Object} params - Exercise parameters
 * @param {number} params.met - MET value
 * @param {number} params.bodyWeightKg - User's body weight
 * @param {number} params.durationMinutes - Duration
 * @param {number} params.weightKg - Weight lifted
 * @param {number} params.reps - Reps
 * @param {number} params.sets - Sets
 * @param {number} params.volumeCoefficient - Volume coefficient
 * @returns {Object} { caloriesTime, caloriesVolume, totalCalories, volume }
 */
export function calculateStrengthCalories({
  met,
  bodyWeightKg,
  durationMinutes,
  weightKg,
  reps,
  sets,
  volumeCoefficient
}) {
  const caloriesTime = calculateCaloriesTime(met, bodyWeightKg, durationMinutes);
  const caloriesVolume = calculateCaloriesVolume(weightKg, reps, sets, volumeCoefficient);
  const volume = weightKg * reps * sets;

  return {
    caloriesTime: Math.round(caloriesTime * 10) / 10,
    caloriesVolume: Math.round(caloriesVolume * 10) / 10,
    totalCalories: Math.round((caloriesTime + caloriesVolume) * 10) / 10,
    volume: Math.round(volume)
  };
}

/**
 * Calculate calories for bodyweight exercises
 * Uses MET-based calculation with bodyweight as the load
 * @param {Object} params - Exercise parameters
 * @param {number} params.met - MET value
 * @param {number} params.bodyWeightKg - User's body weight
 * @param {number} params.durationMinutes - Duration
 * @returns {Object} { totalCalories }
 */
export function calculateBodyweightCalories({
  met,
  bodyWeightKg,
  durationMinutes
}) {
  const totalCalories = calculateCaloriesTime(met, bodyWeightKg, durationMinutes);

  return {
    caloriesTime: Math.round(totalCalories * 10) / 10,
    caloriesVolume: 0,
    totalCalories: Math.round(totalCalories * 10) / 10,
    volume: 0
  };
}

/**
 * Calculate calories for cardio exercises
 * Uses MET-based time calculation only
 * @param {Object} params - Exercise parameters
 * @param {number} params.met - MET value
 * @param {number} params.bodyWeightKg - User's body weight
 * @param {number} params.durationMinutes - Duration
 * @returns {Object} { totalCalories }
 */
export function calculateCardioCalories({
  met,
  bodyWeightKg,
  durationMinutes
}) {
  const totalCalories = calculateCaloriesTime(met, bodyWeightKg, durationMinutes);

  return {
    caloriesTime: Math.round(totalCalories * 10) / 10,
    caloriesVolume: 0,
    totalCalories: Math.round(totalCalories * 10) / 10,
    volume: 0
  };
}

/**
 * Universal calorie calculator - detects exercise type and applies correct formula
 * @param {Object} exercise - Exercise data from database
 * @param {Object} params - Exercise session parameters
 * @param {number} params.bodyWeightKg - User's body weight
 * @param {number} params.durationMinutes - Duration
 * @param {number} [params.weightKg] - Weight lifted (for strength)
 * @param {number} [params.reps] - Reps (for strength/bodyweight)
 * @param {number} [params.sets] - Sets (for strength/bodyweight)
 * @returns {Object} Calorie breakdown
 */
export function calculateExerciseCalories(exercise, params) {
  const { type, met, volumeCoefficient } = exercise;
  const { bodyWeightKg, durationMinutes, weightKg, reps, sets } = params;

  switch (type) {
    case 'strength':
      return calculateStrengthCalories({
        met,
        bodyWeightKg,
        durationMinutes,
        weightKg: weightKg || 0,
        reps: reps || 0,
        sets: sets || 0,
        volumeCoefficient
      });

    case 'bodyweight':
      return calculateBodyweightCalories({
        met,
        bodyWeightKg,
        durationMinutes
      });

    case 'cardio':
      return calculateCardioCalories({
        met,
        bodyWeightKg,
        durationMinutes
      });

    case 'timed':
      // Timed exercises (like Plank, Dead Hang) use bodyweight calculation
      return calculateBodyweightCalories({
        met,
        bodyWeightKg,
        durationMinutes
      });

    default:
      return {
        caloriesTime: 0,
        caloriesVolume: 0,
        totalCalories: 0,
        volume: 0
      };
  }
}
