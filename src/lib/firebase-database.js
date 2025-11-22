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
      data.name.includes("Step-ups")
    ) {
      type = "bodyweight";
      requiresWeight = false;
    }

    return {
      id: doc.id,
      name: data.name,
      category: data.category,
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
  // Get today's logs
  const today = new Date().toISOString().split("T")[0];

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
    date: new Date().toISOString().split("T")[0],
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
    const today = new Date().toISOString().split("T")[0];
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

  const today = new Date().toISOString().split("T")[0];

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
    const today = new Date().toISOString().split("T")[0];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date === today) {
        progress.push({ id: doc.id, ...data });
      }
    });

    callback(progress);
  });
}
