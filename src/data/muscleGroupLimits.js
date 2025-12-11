// Science-based muscle group recovery periods and training frequency limits
export const MUSCLE_GROUP_LIMITS = {
  chest: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Chest'
  },
  back: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Back'
  },
  shoulders: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Shoulders'
  },
  biceps: {
    restDays: 2,
    maxPerWeek: 2,
    category: 'small',
    displayName: 'Biceps'
  },
  triceps: {
    restDays: 2,
    maxPerWeek: 2,
    category: 'small',
    displayName: 'Triceps'
  },
  forearms: {
    restDays: 2,
    maxPerWeek: 3,
    category: 'small',
    displayName: 'Forearms'
  },
  quads: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Quads'
  },
  hamstrings: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Hamstrings'
  },
  glutes: {
    restDays: 3,
    maxPerWeek: 2,
    category: 'large',
    displayName: 'Glutes'
  },
  calves: {
    restDays: 2,
    maxPerWeek: 3,
    category: 'small',
    displayName: 'Calves'
  },
  abs: {
    restDays: 2,
    maxPerWeek: 3,
    category: 'core',
    displayName: 'Core'
  },
  cardio: {
    restDays: 1,
    maxPerWeek: 4,
    category: 'cardio',
    displayName: 'Cardio',
    highIntensityMax: 4
  }
};

// Helper function to get muscle group limit
export function getMuscleLimit(muscleGroup) {
  const normalized = muscleGroup.toLowerCase().trim();
  return MUSCLE_GROUP_LIMITS[normalized] || null;
}

// Helper function to format rest time
export function formatRestTime(days) {
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
}

