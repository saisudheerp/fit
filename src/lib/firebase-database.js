import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get local date string (YYYY-MM-DD) at midnight local time
// This ensures days/weeks/months start at exactly 12:00 AM local time
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get start of day in local time
function getStartOfDay(date = new Date()) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

// Get start of week (Sunday) in local time
function getStartOfWeek(date = new Date()) {
  const newDate = getStartOfDay(date);
  const day = newDate.getDay();
  newDate.setDate(newDate.getDate() - day);
  return newDate;
}

// Get start of month in local time
function getStartOfMonth(date = new Date()) {
  const newDate = getStartOfDay(date);
  newDate.setDate(1);
  return newDate;
}

// ============================================
// PROFILES
// ============================================

export async function getUserProfile(userId) {
  const docRef = doc(db, "profiles", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function createProfile(userId, profileData) {
  await setDoc(doc(db, "profiles", userId), {
    ...profileData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateProfile(userId, profileData) {
  await updateDoc(doc(db, "profiles", userId), {
    ...profileData,
    updatedAt: new Date(),
  });
}

// ============================================
// EXERCISES (Static Data)
// ============================================

export async function getExercises() {
  const q = query(collection(db, "exercises"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();

    // Determine exercise type based on category and name
    let type = "strength";
    let requiresWeight = true;

    // Cardio exercises use duration only, no sets/reps/weight
    if (data.category === "cardio") {
      type = "cardio";
      requiresWeight = false;
    }
    // Time-based exercises (duration only, no sets/reps)
    else if (
      data.name.includes("Plank") ||
      data.name.includes("Dead Hang") ||
      data.name.includes("Farmer Carry")
    ) {
      type = "timed";
      requiresWeight = false;
    }
    // Bodyweight exercises use sets/reps but no weight
    else if (
      data.name.includes("Push-up") ||
      data.name.includes("Pull-up") ||
      data.name.includes("Chin-up") ||
      data.name.includes("Dip") ||
      data.name.includes("Crunch") ||
      data.name.includes("Leg Raise") ||
      data.name.includes("Mountain Climbers") ||
      data.name.includes("Russian Twist") ||
      data.name.includes("Inverted Row") ||
      data.name.includes("Hyperextensions") ||
      data.name.includes("Burpees") ||
      data.name.includes("Lunges") ||
      data.name.includes("Step-ups") ||
      data.name.includes("Box Jump") ||
      data.name.includes("Jumping Jack") ||
      data.name.includes("High Knees") ||
      data.name.includes("Bicycle Crunch") ||
      data.name.includes("Windshield Wiper") ||
      data.name.includes("Hanging Knee Raise")
    ) {
      type = "bodyweight";
      requiresWeight = false;
    }

    return {
      id: doc.id,
      name: data.name,
      category: data.category,
      muscleGroup: data.category, // Add muscleGroup field
      body_part: data.category,
      type: type,
      difficulty: "intermediate",
      equipment: requiresWeight
        ? "weights"
        : type === "cardio" || type === "timed"
        ? type
        : "bodyweight",
      met: data.met_value,
      met_value: data.met_value,
      volume_coefficient: data.volume_coefficient,
      muscles: data.muscles,
      primary: data.muscles?.primary?.[0] || "",
      secondary: data.muscles?.secondary?.[0] || "",
      requiresWeight: requiresWeight,
    };
  });
}

export async function getExercisesByCategory(category) {
  const q = query(
    collection(db, "exercises"),
    where("category", "==", category)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      category: data.category,
      body_part: data.category, // Map category to body_part for component compatibility
      type: "strength", // Default type
      difficulty: "intermediate", // Default difficulty
      equipment: "various", // Default equipment
      met: data.met_value,
      met_value: data.met_value,
      volume_coefficient: data.volume_coefficient,
      muscles: data.muscles,
      primary: data.muscles?.primary?.[0] || "",
      secondary: data.muscles?.secondary?.[0] || "",
    };
  });
}

// ============================================
// EXERCISE LOGS
// ============================================

export async function logExercise(userId, exerciseData) {
  await addDoc(collection(db, "exercise_logs"), {
    user_id: userId, // Changed from userId to user_id to match security rules
    ...exerciseData,
    createdAt: new Date(),
  });
}

export async function deleteExerciseLog(logId) {
  await deleteDoc(doc(db, "exercise_logs", logId));
}

export async function getExerciseLogs(userId, date) {
  const q = query(
    collection(db, "exercise_logs"),
    where("user_id", "==", userId),
    where("date", "==", date)
  );

  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Fetch exercise names for all logs
  const logsWithNames = await Promise.all(
    logs.map(async (log) => {
      // If exerciseName is already saved in the log, use it
      if (log.exerciseName) {
        return log;
      }

      // Otherwise, try to fetch from exercises collection
      try {
        const exerciseDoc = await getDoc(doc(db, "exercises", log.exerciseId));
        return {
          ...log,
          exerciseName: exerciseDoc.exists()
            ? exerciseDoc.data().name
            : "Unknown Exercise",
        };
      } catch (error) {
        return {
          ...log,
          exerciseName: "Unknown Exercise",
        };
      }
    })
  );

  // Sort in memory instead of using orderBy to avoid composite index requirement
  return logsWithNames.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA; // Descending order
  });
}

export async function getRecentLogs(userId, limitCount = 10) {
  const q = query(
    collection(db, "exercise_logs"),
    where("user_id", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Fetch exercise names for all logs
  const logsWithNames = await Promise.all(
    logs.map(async (log) => {
      // If exerciseName is already saved in the log, use it
      if (log.exerciseName) {
        return log;
      }

      // Otherwise, try to fetch from exercises collection
      try {
        const exerciseDoc = await getDoc(doc(db, "exercises", log.exerciseId));
        return {
          ...log,
          exerciseName: exerciseDoc.exists()
            ? exerciseDoc.data().name
            : "Unknown Exercise",
        };
      } catch (error) {
        return {
          ...log,
          exerciseName: "Unknown Exercise",
        };
      }
    })
  );

  // Sort by createdAt in memory and limit
  return logsWithNames
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // Descending order
    })
    .slice(0, limitCount);
}

// Get exercise history by exercise ID for PR progression chart
export async function getExerciseHistory(userId, exerciseId) {
  const q = query(
    collection(db, "exercise_logs"),
    where("user_id", "==", userId),
    where("exerciseId", "==", exerciseId)
  );

  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by date ascending for chart
  return logs.sort((a, b) => {
    const dateA = a.date || a.createdAt?.seconds || 0;
    const dateB = b.date || b.createdAt?.seconds || 0;
    if (typeof dateA === "string" && typeof dateB === "string") {
      return dateA.localeCompare(dateB);
    }
    return dateA - dateB;
  });
}

// ============================================
// WORKOUT SESSIONS
// ============================================

export async function createWorkoutSession(userId, sessionData) {
  const docRef = await addDoc(collection(db, "workout_sessions"), {
    user_id: userId, // Changed from userId to user_id to match security rules
    ...sessionData,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function getWorkoutSessions(userId) {
  const q = query(
    collection(db, "workout_sessions"),
    where("user_id", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const sessions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by date in memory to avoid composite index requirement
  return sessions.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.localeCompare(a.date); // Descending order
  });
}

// ============================================
// STEP LOGS
// ============================================

export async function logSteps(userId, stepsData) {
  const docId = `${userId}_${stepsData.date}`;
  await setDoc(
    doc(db, "step_logs", docId),
    {
      user_id: userId, // Changed from userId to user_id
      ...stepsData,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

export async function getStepLogs(userId, startDate, endDate) {
  const q = query(collection(db, "step_logs"), where("user_id", "==", userId));

  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter by date range in memory to avoid composite index requirement
  const filtered = logs.filter((log) => {
    if (!log.date) return false;
    return log.date >= startDate && log.date <= endDate;
  });

  // Sort by date in memory
  return filtered.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.localeCompare(a.date); // Descending order
  });
}

// ============================================
// STATS
// ============================================

export async function getUserStats(userId) {
  // Get today's logs using local date
  const today = getLocalDateString();

  console.log("getUserStats - userId:", userId, "today:", today);

  const exerciseLogs = await getExerciseLogs(userId, today);
  const stepLogs = await getStepLogs(userId, today, today);

  console.log("getUserStats - exerciseLogs:", exerciseLogs);
  console.log("getUserStats - stepLogs:", stepLogs);

  const totalCalories = exerciseLogs.reduce(
    (sum, log) => sum + (log.caloriesBurned || 0),
    0
  );
  const totalVolume = exerciseLogs.reduce(
    (sum, log) => sum + (log.volume || 0),
    0
  );
  const totalSteps = stepLogs.reduce((sum, log) => sum + (log.steps || 0), 0);

  console.log("getUserStats - totals:", {
    totalCalories,
    totalVolume,
    totalSteps,
    workoutsToday: exerciseLogs.length,
  });

  return {
    totalCalories,
    totalVolume,
    totalSteps,
    workoutsToday: exerciseLogs.length,
  };
}

export async function getWeeklyStats(userId) {
  const today = new Date();

  // Get data for each of the last 7 days starting from Monday
  const stats = [];

  // Find the most recent Monday
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days, else go back to Monday

  const monday = new Date(today);
  monday.setDate(monday.getDate() - daysToMonday);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dateStr = getLocalDateString(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    try {
      // Get exercise logs for this specific date
      const logs = await getExerciseLogs(userId, dateStr);

      const calories = logs.reduce(
        (sum, log) => sum + (log.caloriesBurned || 0),
        0
      );
      const workouts = logs.length;

      stats.push({
        date: dateStr,
        day: dayName,
        calories: Math.round(calories),
        workouts: workouts,
      });
    } catch (error) {
      console.error(`Error fetching stats for ${dateStr}:`, error);
      stats.push({
        date: dateStr,
        day: dayName,
        calories: 0,
        workouts: 0,
      });
    }
  }

  return stats;
}

export async function getWeeklyMuscleData(userId) {
  const today = new Date();
  const stats = [];

  // Find the most recent Monday
  const currentDay = today.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - daysToMonday);

  // Helper function to normalize muscle names
  const normalizeMuscle = (muscleName) => {
    if (!muscleName) return null;
    const name = muscleName.toLowerCase().trim();

    // Map variations to standard muscle group names
    if (name.includes("chest") || name.includes("pec")) return "chest";
    if (name.includes("shoulder") || name.includes("delt")) return "shoulders";
    if (
      name.includes("bicep") ||
      name === "biceps" ||
      name.includes("brachialis")
    )
      return "biceps";
    if (name.includes("tricep")) return "triceps";
    if (
      name.includes("forearm") ||
      name.includes("wrist") ||
      name.includes("grip")
    )
      return "forearms";
    if (
      name.includes("abs") ||
      name.includes("core") ||
      name.includes("abdominal") ||
      name.includes("rectus abdominis") ||
      name.includes("oblique")
    )
      return "abs";
    if (
      name.includes("back") ||
      name.includes("lat") ||
      name.includes("trap") ||
      name.includes("rhomboid") ||
      name.includes("erector spinae") ||
      name.includes("rotator cuff")
    )
      return "back";
    if (name.includes("glute") || name.includes("butt")) return "glutes";
    if (
      name.includes("quad") ||
      name.includes("thigh") ||
      name.includes("hip flexor")
    )
      return "quads";
    if (name.includes("hamstring")) return "hamstrings";
    if (
      name.includes("calf") ||
      name.includes("calves") ||
      name.includes("gastrocnemius") ||
      name.includes("soleus")
    )
      return "calves";
    if (name.includes("leg")) return "quads"; // Default legs to quads

    // Ignore these - they don't map to specific muscle groups
    if (name.includes("full body") || name.includes("neck")) return null;

    return null;
  };

  // Helper function to extract muscles from different data formats
  const extractMuscles = (exerciseData) => {
    const primary = [];
    const secondary = [];

    // Format 1: muscles.primary/secondary as arrays
    if (exerciseData.muscles) {
      if (Array.isArray(exerciseData.muscles.primary)) {
        exerciseData.muscles.primary.forEach((m) => {
          const normalized = normalizeMuscle(m);
          if (normalized) primary.push(normalized);
        });
      }
      if (Array.isArray(exerciseData.muscles.secondary)) {
        exerciseData.muscles.secondary.forEach((m) => {
          const normalized = normalizeMuscle(m);
          if (normalized) secondary.push(normalized);
        });
      }
    }

    // Format 2: primary/secondary as objects with muscle property
    if (exerciseData.primary && exerciseData.primary.muscle) {
      const muscles = exerciseData.primary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !primary.includes(normalized))
          primary.push(normalized);
      });
    }
    if (exerciseData.secondary && exerciseData.secondary.muscle) {
      const muscles = exerciseData.secondary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !secondary.includes(normalized))
          secondary.push(normalized);
      });
    }
    if (exerciseData.tertiary && exerciseData.tertiary.muscle) {
      const muscles = exerciseData.tertiary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !secondary.includes(normalized))
          secondary.push(normalized);
      });
    }

    // Fallback: try to infer from exercise name and category
    if (primary.length === 0 && exerciseData.name) {
      const name = exerciseData.name.toLowerCase();
      const category = (
        exerciseData.category ||
        exerciseData.bodyPart ||
        ""
      ).toLowerCase();

      if (
        category.includes("chest") ||
        name.includes("bench") ||
        name.includes("press")
      ) {
        primary.push("chest");
      } else if (
        category.includes("back") ||
        name.includes("row") ||
        name.includes("pull")
      ) {
        primary.push("back");
      } else if (category.includes("shoulder") || name.includes("shoulder")) {
        primary.push("shoulders");
      } else if (category.includes("arm")) {
        if (name.includes("curl") || name.includes("bicep"))
          primary.push("biceps");
        else if (name.includes("tricep") || name.includes("extension"))
          primary.push("triceps");
      } else if (category.includes("leg")) {
        if (name.includes("squat") || name.includes("quad"))
          primary.push("quads");
        else if (name.includes("curl") || name.includes("hamstring"))
          primary.push("hamstrings");
        else if (name.includes("calf")) primary.push("calves");
        else primary.push("quads");
      } else if (category.includes("abs") || category.includes("core")) {
        primary.push("abs");
      }
    }

    return {
      primary: [...new Set(primary)],
      secondary: [...new Set(secondary)],
    };
  };

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dateStr = getLocalDateString(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    try {
      const logs = await getExerciseLogs(userId, dateStr);
      if (logs.length === 0) {
        stats.push({
          date: dateStr,
          day: dayName,
          exercises: [],
          calories: 0,
        });
        continue;
      }

      const totalCalories = logs.reduce(
        (sum, log) => sum + (log.caloriesBurned || 0),
        0
      );

      // Batch fetch all exercise documents at once for better performance
      const uniqueExerciseIds = [...new Set(logs.map((log) => log.exerciseId))];
      const exerciseDocsPromises = uniqueExerciseIds.map((id) =>
        getDoc(doc(db, "exercises", id))
      );
      const exerciseDocs = await Promise.all(exerciseDocsPromises);

      // Create exercise cache for quick lookup
      const exerciseCache = {};
      exerciseDocs.forEach((docSnap, idx) => {
        if (docSnap.exists()) {
          exerciseCache[uniqueExerciseIds[idx]] = docSnap.data();
        }
      });

      // Map logs to exercises using cache
      const exercisesWithMuscles = logs
        .map((log) => {
          const exerciseData = exerciseCache[log.exerciseId];
          if (exerciseData) {
            return {
              ...log,
              name: exerciseData.name,
              category: exerciseData.category || exerciseData.bodyPart,
              muscles: extractMuscles(exerciseData),
            };
          }
          return null;
        })
        .filter((e) => e !== null);

      stats.push({
        date: dateStr,
        day: dayName,
        exercises: exercisesWithMuscles.filter((e) => e !== null),
        calories: Math.round(totalCalories),
      });
    } catch (error) {
      console.error(`Error fetching muscle data for ${dateStr}:`, error);
      stats.push({
        date: dateStr,
        day: dayName,
        exercises: [],
        calories: 0,
      });
    }
  }

  return stats;
}

export async function getMonthlyMuscleData(userId, monthOffset = 0) {
  const today = new Date();
  const stats = [];

  // Get first day of target month (current month + offset)
  const firstDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1
  );

  // Get number of days in target month
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset + 1,
    0
  );
  const daysInMonth = lastDayOfMonth.getDate();

  // Helper function to normalize muscle names (same as weekly)
  const normalizeMuscle = (muscleName) => {
    if (!muscleName) return null;
    const name = muscleName.toLowerCase().trim();

    if (name.includes("chest") || name.includes("pec")) return "chest";
    if (name.includes("shoulder") || name.includes("delt")) return "shoulders";
    if (
      name.includes("bicep") ||
      name === "biceps" ||
      name.includes("brachialis")
    )
      return "biceps";
    if (name.includes("tricep")) return "triceps";
    if (
      name.includes("forearm") ||
      name.includes("wrist") ||
      name.includes("grip")
    )
      return "forearms";
    if (
      name.includes("abs") ||
      name.includes("core") ||
      name.includes("abdominal") ||
      name.includes("rectus abdominis") ||
      name.includes("oblique")
    )
      return "abs";
    if (
      name.includes("back") ||
      name.includes("lat") ||
      name.includes("trap") ||
      name.includes("rhomboid") ||
      name.includes("erector spinae") ||
      name.includes("rotator cuff")
    )
      return "back";
    if (name.includes("glute") || name.includes("butt")) return "glutes";
    if (
      name.includes("quad") ||
      name.includes("thigh") ||
      name.includes("hip flexor")
    )
      return "quads";
    if (name.includes("hamstring")) return "hamstrings";
    if (
      name.includes("calf") ||
      name.includes("calves") ||
      name.includes("gastrocnemius") ||
      name.includes("soleus")
    )
      return "calves";
    if (name.includes("leg")) return "quads";

    if (name.includes("full body") || name.includes("neck")) return null;

    return null;
  };

  // Helper function to extract muscles (same as weekly)
  const extractMuscles = (exerciseData) => {
    const primary = [];
    const secondary = [];

    if (exerciseData.muscles) {
      if (Array.isArray(exerciseData.muscles.primary)) {
        exerciseData.muscles.primary.forEach((m) => {
          const normalized = normalizeMuscle(m);
          if (normalized) primary.push(normalized);
        });
      }
      if (Array.isArray(exerciseData.muscles.secondary)) {
        exerciseData.muscles.secondary.forEach((m) => {
          const normalized = normalizeMuscle(m);
          if (normalized) secondary.push(normalized);
        });
      }
    }

    if (exerciseData.primary && exerciseData.primary.muscle) {
      const muscles = exerciseData.primary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !primary.includes(normalized))
          primary.push(normalized);
      });
    }
    if (exerciseData.secondary && exerciseData.secondary.muscle) {
      const muscles = exerciseData.secondary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !secondary.includes(normalized))
          secondary.push(normalized);
      });
    }
    if (exerciseData.tertiary && exerciseData.tertiary.muscle) {
      const muscles = exerciseData.tertiary.muscle
        .split(",")
        .map((m) => m.trim());
      muscles.forEach((m) => {
        const normalized = normalizeMuscle(m);
        if (normalized && !secondary.includes(normalized))
          secondary.push(normalized);
      });
    }

    return {
      primary: [...new Set(primary)],
      secondary: [...new Set(secondary)],
    };
  };

  // Fetch all days in the month
  for (let i = 0; i < daysInMonth; i++) {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() + i);
    const dateStr = getLocalDateString(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    try {
      const logs = await getExerciseLogs(userId, dateStr);
      if (logs.length === 0) {
        stats.push({
          date: dateStr,
          day: dayName,
          exercises: [],
          calories: 0,
        });
        continue;
      }

      const totalCalories = logs.reduce(
        (sum, log) => sum + (log.caloriesBurned || 0),
        0
      );

      // Batch fetch exercise documents
      const uniqueExerciseIds = [...new Set(logs.map((log) => log.exerciseId))];
      const exerciseDocs = await Promise.all(
        uniqueExerciseIds.map((id) => getDoc(doc(db, "exercises", id)))
      );

      const exerciseCache = {};
      exerciseDocs.forEach((docSnap, idx) => {
        if (docSnap.exists()) {
          exerciseCache[uniqueExerciseIds[idx]] = docSnap.data();
        }
      });

      const exercisesWithMuscles = logs
        .map((log) => {
          const exerciseData = exerciseCache[log.exerciseId];
          if (exerciseData) {
            return {
              ...log,
              name: exerciseData.name,
              category: exerciseData.category || exerciseData.bodyPart,
              muscles: extractMuscles(exerciseData),
            };
          }
          return null;
        })
        .filter((e) => e !== null);

      stats.push({
        date: dateStr,
        day: dayName,
        exercises: exercisesWithMuscles.filter((e) => e !== null),
        calories: Math.round(totalCalories),
      });
    } catch (error) {
      console.error(`Error fetching muscle data for ${dateStr}:`, error);
      stats.push({
        date: dateStr,
        day: dayName,
        exercises: [],
        calories: 0,
      });
    }
  }

  return stats;
}

// ============================================
// ROUTINES
// ============================================

export async function getRoutines(userId) {
  const q = query(collection(db, "routines"), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  const routines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Sort by createdAt in JavaScript to avoid needing a Firebase index
  return routines.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB - dateA; // desc order (newest first)
  });
}

export async function getRoutine(routineId) {
  const docRef = doc(db, "routines", routineId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function createRoutine(userId, routineData) {
  const docRef = await addDoc(collection(db, "routines"), {
    user_id: userId,
    ...routineData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function updateRoutine(routineId, routineData) {
  await updateDoc(doc(db, "routines", routineId), {
    ...routineData,
    updatedAt: new Date(),
  });
}

export async function deleteRoutine(routineId) {
  await deleteDoc(doc(db, "routines", routineId));
}

export async function duplicateRoutine(userId, routineId) {
  const routine = await getRoutine(routineId);
  if (!routine) throw new Error("Routine not found");

  const { id, createdAt, updatedAt, ...routineData } = routine;
  const newRoutine = {
    ...routineData,
    name: `${routineData.name} (Copy)`,
    user_id: userId,
  };

  return await createRoutine(userId, newRoutine);
}

// ============================================
// WORKOUT SESSIONS IN PROGRESS
// ============================================

export async function saveWorkoutProgress(userId, routineName, progressData) {
  const docRef = doc(
    db,
    "workout_progress",
    `${userId}_${routineName.replace(/\s+/g, "_")}`
  );
  await setDoc(docRef, {
    userId,
    routineName,
    ...progressData,
    lastUpdated: Timestamp.now(),
    date: getLocalDateString(),
  });
}

export async function getWorkoutProgress(userId, routineName) {
  const docRef = doc(
    db,
    "workout_progress",
    `${userId}_${routineName.replace(/\s+/g, "_")}`
  );
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getAllWorkoutProgress(userId) {
  const q = query(
    collection(db, "workout_progress"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);

  const progress = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Check if it's from today
    const today = getLocalDateString();
    if (data.date === today) {
      progress.push({ id: doc.id, ...data });
    }
  });

  return progress;
}

export async function deleteWorkoutProgress(userId, routineName) {
  const docRef = doc(
    db,
    "workout_progress",
    `${userId}_${routineName.replace(/\s+/g, "_")}`
  );
  await deleteDoc(docRef);
}

export async function deleteAllOldWorkoutProgress(userId) {
  // Delete only the current user's old workout progress
  // This prevents permission errors when trying to query all documents
  if (!userId) return;

  const today = getLocalDateString();

  const q = query(
    collection(db, "workout_progress"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);

  const deletePromises = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.date !== today) {
      deletePromises.push(deleteDoc(doc.ref));
    }
  });

  await Promise.all(deletePromises);
}

export function subscribeToWorkoutProgress(userId, callback) {
  const q = query(
    collection(db, "workout_progress"),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const progress = [];
    const today = getLocalDateString();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date === today) {
        progress.push({ id: doc.id, ...data });
      }
    });

    callback(progress);
  });
}

// ============================================
// PERSONAL RECORDS (PR) TRACKING
// ============================================

export async function savePR(userId, prData) {
  const docRef = doc(db, "personal_records", `${userId}_${prData.exerciseId}`);

  await setDoc(
    docRef,
    {
      user_id: userId,
      exerciseId: prData.exerciseId,
      exerciseName: prData.exerciseName,
      maxWeight: prData.maxWeight || 0,
      maxReps: prData.maxReps || 0,
      maxVolume: prData.maxVolume || 0,
      maxWeightDate: prData.maxWeightDate || null,
      maxRepsDate: prData.maxRepsDate || null,
      maxVolumeDate: prData.maxVolumeDate || null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

export async function getPR(userId, exerciseId) {
  const docRef = doc(db, "personal_records", `${userId}_${exerciseId}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getAllPRs(userId) {
  const q = query(
    collection(db, "personal_records"),
    where("user_id", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const prs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by most recent update
  return prs.sort((a, b) => {
    const timeA = a.updatedAt?.seconds || 0;
    const timeB = b.updatedAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function checkAndUpdatePR(
  userId,
  exerciseId,
  exerciseName,
  weight,
  reps,
  sets
) {
  const volume = weight * reps * sets;
  const currentPR = await getPR(userId, exerciseId);

  let isNewPR = false;
  let prType = [];

  const today = new Date().toISOString();

  if (!currentPR) {
    // First time doing this exercise - everything is a PR!
    await savePR(userId, {
      exerciseId,
      exerciseName,
      maxWeight: weight,
      maxReps: reps,
      maxVolume: volume,
      maxWeightDate: today,
      maxRepsDate: today,
      maxVolumeDate: today,
    });
    return {
      isNewPR: true,
      prType: ["weight", "reps", "volume"],
      data: { weight, reps, volume },
    };
  }

  const updates = {
    exerciseId,
    exerciseName,
    maxWeight: currentPR.maxWeight,
    maxReps: currentPR.maxReps,
    maxVolume: currentPR.maxVolume,
    maxWeightDate: currentPR.maxWeightDate,
    maxRepsDate: currentPR.maxRepsDate,
    maxVolumeDate: currentPR.maxVolumeDate,
  };

  // Check for new PRs
  if (weight > currentPR.maxWeight) {
    updates.maxWeight = weight;
    updates.maxWeightDate = today;
    prType.push("weight");
    isNewPR = true;
  }

  if (reps > currentPR.maxReps) {
    updates.maxReps = reps;
    updates.maxRepsDate = today;
    prType.push("reps");
    isNewPR = true;
  }

  if (volume > currentPR.maxVolume) {
    updates.maxVolume = volume;
    updates.maxVolumeDate = today;
    prType.push("volume");
    isNewPR = true;
  }

  if (isNewPR) {
    await savePR(userId, updates);
  }

  return { isNewPR, prType, data: { weight, reps, volume }, currentPR };
}

// ============================================
// ACTIVE ROUTINE PROGRAMS (Multi-Day Tracking)
// ============================================

export async function createActiveProgram(userId, programData) {
  const docRef = await addDoc(collection(db, "active_programs"), {
    user_id: userId,
    programName: programData.programName,
    goal: programData.goal,
    totalDays: programData.totalDays,
    currentDay: 0, // Start at day 0, will increment to 1 on first workout
    allRoutines: programData.allRoutines, // Array of all daily routines
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function getActiveProgram(userId) {
  const q = query(
    collection(db, "active_programs"),
    where("user_id", "==", userId),
    where("isActive", "==", true),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
}

export async function getCurrentDayRoutine(userId) {
  const program = await getActiveProgram(userId);
  if (!program) return null;

  const dayIndex = program.currentDay % program.totalDays;
  const dayRoutine = program.allRoutines[dayIndex];

  // Enrich exercises with full details from exercises collection
  const enrichedExercises = await Promise.all(
    dayRoutine.exercises.map(async (ex) => {
      // If exercise already has name, use it directly
      if (ex.name && ex.name !== "Unknown Exercise") {
        return ex;
      }

      // Otherwise try to fetch from exercises collection
      try {
        const exerciseDoc = await getDoc(doc(db, "exercises", ex.exerciseId));
        if (exerciseDoc.exists()) {
          const exerciseData = exerciseDoc.data();
          return {
            ...ex,
            name: exerciseData.name,
            muscleGroup: exerciseData.muscleGroup || ex.muscleGroup,
          };
        }
      } catch (error) {
        console.error("Error fetching exercise:", error);
      }

      // Fallback to existing data
      return ex;
    })
  );

  return {
    ...dayRoutine,
    exercises: enrichedExercises,
    programId: program.id,
    currentDay: program.currentDay + 1, // Display as 1-indexed
    totalDays: program.totalDays,
    programName: program.programName,
  };
}

export async function completeCurrentDay(userId) {
  const program = await getActiveProgram(userId);
  if (!program) return;

  const nextDay = (program.currentDay + 1) % program.totalDays;

  await updateDoc(doc(db, "active_programs", program.id), {
    currentDay: nextDay,
    updatedAt: new Date(),
  });
}

export async function deactivateProgram(programId) {
  await updateDoc(doc(db, "active_programs", programId), {
    isActive: false,
    updatedAt: new Date(),
  });
}

export async function resetProgramDay(programId, dayNumber) {
  await updateDoc(doc(db, "active_programs", programId), {
    currentDay: dayNumber,
    updatedAt: new Date(),
  });
}

// ============================================
// WORKOUT TRACKING & MILESTONES
// ============================================

/**
 * Get all unique workout dates for a user
 * Returns array of date strings (YYYY-MM-DD)
 */
export async function getWorkoutDates(userId) {
  const q = query(
    collection(db, "exercise_logs"),
    where("user_id", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  const dates = new Set();

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.date) {
      dates.add(data.date);
    }
  });

  return Array.from(dates).sort();
}

/**
 * Calculate current workout streak (consecutive days)
 * Returns { currentStreak, longestStreak, isNewStreak, milestoneReached }
 */
export async function calculateWorkoutStreak(userId) {
  const dates = await getWorkoutDates(userId);

  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isNewStreak: false };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = getLocalDateString();
  const yesterday = getLocalDateString(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  // Check if there's a workout today or yesterday
  let checkDate = dates.includes(today) ? today : yesterday;
  if (!dates.includes(checkDate)) {
    // Streak is broken
    currentStreak = 0;
  } else {
    // Count backwards from today/yesterday
    let currentDate = new Date(checkDate);
    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = getLocalDateString(currentDate);
      if (dates.includes(dateStr)) {
        currentStreak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.floor(
      (currDate - prevDate) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Check if today's workout extends the streak (new streak milestone)
  const isNewStreak = dates[dates.length - 1] === today;

  // Check for milestone (3, 7, 14, 30, 60, 100 days)
  const milestones = [3, 7, 14, 30, 60, 100];
  const milestoneReached = milestones.includes(currentStreak)
    ? currentStreak
    : null;

  return {
    currentStreak,
    longestStreak,
    isNewStreak,
    milestoneReached,
  };
}

/**
 * Calculate total volume lifted (all time)
 * Returns { totalVolume, milestoneReached }
 */
export async function calculateTotalVolume(userId) {
  const q = query(
    collection(db, "exercise_logs"),
    where("user_id", "==", userId)
  );

  const querySnapshot = await getDocs(q);
  let totalVolume = 0;
  let lastVolume = 0;

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.volume) {
      lastVolume = data.volume;
      totalVolume += data.volume;
    }
  });

  // Check for milestones: 10k, 25k, 50k, 100k, 250k, 500k, 1M kg
  const milestones = [
    10000, 25000, 50000, 100000, 250000, 500000, 1000000,
  ];
  let milestoneReached = null;

  // Check if we just crossed a milestone with the last exercise
  const previousVolume = totalVolume - lastVolume;
  for (const milestone of milestones) {
    if (totalVolume >= milestone && previousVolume < milestone) {
      milestoneReached = milestone;
      break;
    }
  }

  return { totalVolume, milestoneReached };
}

/**
 * Get workout count
 * Returns { totalWorkouts, milestoneReached }
 */
export async function getWorkoutCount(userId) {
  const dates = await getWorkoutDates(userId);
  const totalWorkouts = dates.length;

  // Check for milestones: 1, 10, 25, 50, 100, 250, 500 workouts
  const milestones = [1, 10, 25, 50, 100, 250, 500];
  const milestoneReached = milestones.includes(totalWorkouts)
    ? totalWorkouts
    : null;

  return { totalWorkouts, milestoneReached };
}
