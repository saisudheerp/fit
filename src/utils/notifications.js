// Browser Push Notifications Utility

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return { success: false, error: 'Notifications not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { success: permission === 'granted', permission };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Show a browser notification
 */
export function showNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    icon: '/nextrep.svg',
    badge: '/nextrep.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options
  };

  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Predefined notification templates for common scenarios
 */
export const notificationTemplates = {
  // Workout milestones
  newPR: (exerciseName, value) => ({
    title: '🎉 New Personal Record!',
    body: `You just crushed a PR on ${exerciseName}! ${value}`,
    icon: '/nextrep.svg',
    tag: 'pr-notification',
  }),

  workoutStreak: (days) => ({
    title: `🔥 ${days}-Day Streak!`,
    body: `You're on fire! Keep up the amazing consistency!`,
    icon: '/nextrep.svg',
    tag: 'streak-notification',
  }),

  firstWorkout: () => ({
    title: '💪 Welcome to Next Rep!',
    body: 'Your first workout is logged! The journey to greatness begins now.',
    icon: '/nextrep.svg',
    tag: 'welcome-notification',
  }),

  // Progress milestones
  volumeMilestone: (volume) => ({
    title: '📊 Volume Milestone Reached!',
    body: `Incredible! You've lifted ${volume.toLocaleString()} kg total volume!`,
    icon: '/nextrep.svg',
    tag: 'volume-notification',
  }),

  workoutCount: (count) => ({
    title: '🏆 Workout Milestone!',
    body: `${count} workouts completed! You're building something amazing!`,
    icon: '/nextrep.svg',
    tag: 'workout-count-notification',
  }),

  // Motivation & reminders
  weeklyGoal: (completed, total) => ({
    title: '🎯 Weekly Goal Update',
    body: `${completed}/${total} workouts this week. You're doing great!`,
    icon: '/nextrep.svg',
    tag: 'weekly-goal',
  }),

  restDayReminder: () => ({
    title: '😴 Recovery Day',
    body: 'Your muscles grow when you rest. Take care of yourself today!',
    icon: '/nextrep.svg',
    tag: 'rest-reminder',
  }),

  workoutReminder: (routineName) => ({
    title: '💪 Workout Pending Today!',
    body: `You have "${routineName}" scheduled. Time to crush it!`,
    icon: '/nextrep.svg',
    tag: 'workout-reminder',
    requireInteraction: true,
  }),

  // Recovery notifications
  muscleRecovered: (muscleName) => ({
    title: '✅ Muscle Recovered!',
    body: `Your ${muscleName} is fully recovered and ready to train!`,
    icon: '/nextrep.svg',
    tag: 'recovery-notification',
  }),

  // AI Coach notifications
  aiTip: (tip) => ({
    title: '💡 Coach\'s Insight',
    body: tip,
    icon: '/nextrep.svg',
    tag: 'ai-tip',
  }),
};

/**
 * Save notification preference to localStorage
 */
export function saveNotificationPreference(enabled) {
  localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
  localStorage.setItem('notificationPromptShown', 'true');
}

/**
 * Get notification preference from localStorage
 */
export function getNotificationPreference() {
  return localStorage.getItem('notificationsEnabled') === 'true';
}

/**
 * Check if notification prompt has been shown before
 */
export function hasShownNotificationPrompt() {
  return localStorage.getItem('notificationPromptShown') === 'true';
}
