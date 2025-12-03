import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  duplicateRoutine,
  getExercises,
  createWorkoutSession,
  logExercise,
  saveWorkoutProgress,
  getAllWorkoutProgress,
  deleteWorkoutProgress,
  subscribeToWorkoutProgress,
  deleteAllOldWorkoutProgress,
  getWorkoutSessions,
  getCurrentDayRoutine,
  completeCurrentDay,
  getActiveProgram,
  deactivateProgram,
  getLocalDateString,
  checkAndUpdatePR,
} from "../lib/firebase-database";
import { calculateExerciseCalories } from "../lib/calorieEngine";

export default function Routines() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showPredefinedModal, setShowPredefinedModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [currentDayRoutine, setCurrentDayRoutine] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
      checkForSavedWorkout();
      // Clean up old workout progress from previous days
      deleteAllOldWorkoutProgress(user.uid).catch((err) =>
        console.error("Error cleaning old progress:", err)
      );

      // Schedule cleanup at midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const midnightCleanup = setTimeout(() => {
        deleteAllOldWorkoutProgress(user.uid).catch((err) =>
          console.error("Error cleaning old progress:", err)
        );
        // Set up daily interval after first cleanup
        const dailyCleanup = setInterval(() => {
          deleteAllOldWorkoutProgress(user.uid).catch((err) =>
            console.error("Error cleaning old progress:", err)
          );
        }, 24 * 60 * 60 * 1000); // 24 hours

        return () => clearInterval(dailyCleanup);
      }, msUntilMidnight);

      return () => clearTimeout(midnightCleanup);
    }
  }, [user]);

  useEffect(() => {
    if (!user || routines.length === 0) return;

    // Subscribe to real-time updates for workout progress
    const unsubscribe = subscribeToWorkoutProgress(user.uid, (progress) => {
      if (progress.length > 0) {
        // Match progress with loaded routines
        const progressWithRoutines = progress
          .map((p) => {
            const matchingRoutine = routines.find(
              (r) => r.name === p.routineName
            );
            if (matchingRoutine) {
              return { ...p, routine: matchingRoutine };
            }
            return p;
          })
          .filter((p) => p.routine); // Only keep progress with matching routines

        // Sort by most recent
        progressWithRoutines.sort((a, b) => {
          const timeA = a.lastUpdated?.seconds || 0;
          const timeB = b.lastUpdated?.seconds || 0;
          return timeB - timeA;
        });

        setSavedWorkout(progressWithRoutines);
      } else {
        setSavedWorkout(null);
      }
    });

    return () => unsubscribe();
  }, [user, routines]);

  const checkForSavedWorkout = async () => {
    if (!user) return;

    try {
      const progress = await getAllWorkoutProgress(user.uid);

      if (progress.length > 0) {
        // Match progress with loaded routines or active program
        const progressWithRoutines = progress
          .map((p) => {
            // First try to match with regular routines
            const matchingRoutine = routines.find(
              (r) => r.name === p.routineName
            );
            if (matchingRoutine) {
              return { ...p, routine: matchingRoutine };
            }

            // If no match, check if it's the current day routine from active program
            if (currentDayRoutine && currentDayRoutine.name === p.routineName) {
              return {
                ...p,
                routine: {
                  name: currentDayRoutine.name,
                  exercises: currentDayRoutine.exercises,
                  muscleGroups: currentDayRoutine.muscleGroups,
                  isProgramDay: true,
                },
              };
            }

            return p;
          })
          .filter((p) => p.routine);

        // Sort by most recent
        progressWithRoutines.sort((a, b) => {
          const timeA = a.lastUpdated?.seconds || 0;
          const timeB = b.lastUpdated?.seconds || 0;
          return timeB - timeA;
        });

        setSavedWorkout(progressWithRoutines);
      } else {
        setSavedWorkout(null);
      }
    } catch (error) {
      console.error("Error loading saved workouts:", error);
    }
  };

  // Re-check for saved workout when routines or currentDayRoutine are loaded
  useEffect(() => {
    if (routines.length > 0 || currentDayRoutine) {
      checkForSavedWorkout();
    }
  }, [routines, currentDayRoutine]);

  // Handle resume workout from dashboard
  useEffect(() => {
    if (location.state?.resumeWorkout && routines.length > 0) {
      const workoutData = location.state.resumeWorkout;
      const matchingRoutine = routines.find(
        (r) => r.name === workoutData.routineName
      );

      if (matchingRoutine && workoutData.routine) {
        // Resume the workout with saved progress
        setActiveWorkout({
          routine: workoutData.routine,
          currentExerciseIndex: workoutData.currentExerciseIndex || 0,
          currentSet: workoutData.currentSet || 1,
          completedSets: workoutData.completedSets || [],
          exerciseStates: workoutData.exerciseStates || {},
          skippedSets: workoutData.skippedSets || [],
          sessionId: workoutData.sessionId,
          startTime: new Date(),
          isResume: true,
        });
      }

      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state, routines]);

  // Load completed workouts for today
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      if (!user) return;

      try {
        const sessions = await getWorkoutSessions(user.uid);
        const today = getLocalDateString();
        const todaySessions = sessions.filter((s) => s.date === today);

        // Get unique routine names
        const uniqueRoutines = [
          ...new Set(todaySessions.map((s) => s.routineName)),
        ];
        setCompletedWorkouts(uniqueRoutines);
      } catch (error) {
        console.error("Error loading completed workouts:", error);
      }
    };

    loadCompletedWorkouts();
  }, [user]);

  const loadData = async () => {
    try {
      const [routinesData, exercisesData, programData, currentDay] =
        await Promise.all([
          getRoutines(user.uid),
          getExercises(),
          getActiveProgram(user.uid),
          getCurrentDayRoutine(user.uid),
        ]);
      setRoutines(routinesData);
      setExercises(exercisesData);
      setActiveProgram(programData);
      setCurrentDayRoutine(currentDay);
    } catch (error) {
      console.error("Error loading routines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!confirm("Are you sure you want to delete this routine?")) return;

    try {
      await deleteRoutine(routineId);
      setRoutines(routines.filter((r) => r.id !== routineId));
      if (selectedRoutine?.id === routineId) setSelectedRoutine(null);
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast.error("Failed to delete routine");
    }
  };

  const handleDeleteAllRoutines = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ALL ${routines.length} routines? This cannot be undone!`
      )
    )
      return;

    try {
      // Delete all routines one by one
      for (const routine of routines) {
        await deleteRoutine(routine.id);
      }
      setRoutines([]);
      setSelectedRoutine(null);
    } catch (error) {
      console.error("Error deleting all routines:", error);
      toast.error("Failed to delete routines");
    }
  };

  const handleDuplicateRoutine = async (routineId) => {
    try {
      await duplicateRoutine(user.uid, routineId);
      await loadData();
    } catch (error) {
      console.error("Error duplicating routine:", error);
      toast.error("Failed to duplicate routine");
    }
  };

  const handleSaveRoutine = async (routineData) => {
    try {
      if (editingRoutine) {
        await updateRoutine(editingRoutine.id, routineData);
      } else {
        await createRoutine(user.uid, routineData);
      }
      await loadData();
      setShowCreateModal(false);
      setEditingRoutine(null);
    } catch (error) {
      console.error("Error saving routine:", error);
      toast.error("Failed to save routine");
    }
  };

  const handleStartWorkout = (routine) => {
    // Don't clear saved workouts - allow multiple in-progress workouts
    // Each routine will have its own saved state

    // Normalize exercise structure - ensure exerciseData exists
    const normalizedExercises = routine.exercises.map((ex) => {
      // If exercise already has exerciseData, use it
      if (ex.exerciseData) {
        return ex;
      }
      // If exercise has name directly (from custom programs), wrap it in exerciseData
      return {
        ...ex,
        exerciseData: {
          id: ex.exerciseId || ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          category: ex.category || ex.muscleGroup,
          type: ex.category === "cardio" ? "cardio" : "strength",
          met: 8.0, // Default MET value
          volume_coefficient: 1.0,
        },
      };
    });

    setActiveWorkout({
      routine: {
        ...routine,
        exercises: normalizedExercises,
      },
      currentExerciseIndex: 0,
      currentSet: 1,
      completedSets: [],
      startTime: new Date(),
      isResume: false, // Flag for fresh start
    });
    setSelectedRoutine(null);
  };

  const handleGeneratePredefined = async (type) => {
    const routineConfig = {
      home: {
        name: "Home Bodyweight Routine",
        type: "home",
        split: "Full Body",
        muscleGroups: ["chest", "back", "shoulders", "legs", "core"],
      },
      gym: {
        name: "Gym Strength Routine",
        type: "gym",
        split: "Full Body",
        muscleGroups: [
          "chest",
          "back",
          "shoulders",
          "legs",
          "biceps",
          "triceps",
        ],
      },
      full_body: {
        name: "Full Body Workout",
        type: "gym",
        split: "Full Body",
        muscleGroups: ["chest", "back", "shoulders", "legs", "arms", "core"],
      },
      upper_lower: {
        name: "Upper Body Split",
        type: "gym",
        split: "Upper Body",
        muscleGroups: ["chest", "back", "shoulders", "biceps", "triceps"],
      },
      ppl: {
        name: "Push Day",
        type: "gym",
        split: "Push",
        muscleGroups: ["chest", "shoulders", "triceps"],
      },
    };

    const config = routineConfig[type];
    const filteredExercises = exercises.filter((ex) => {
      const bodyPart = (ex.body_part || "").toLowerCase();
      return config.muscleGroups.some((group) => bodyPart.includes(group));
    });

    const selectedExercises = [];
    const exercisesPerGroup = Math.max(
      1,
      Math.floor(6 / config.muscleGroups.length)
    );

    config.muscleGroups.forEach((group) => {
      const groupExercises = filteredExercises.filter((ex) =>
        (ex.body_part || "").toLowerCase().includes(group)
      );

      const selected = groupExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, exercisesPerGroup);

      selected.forEach((ex) => {
        const isTimed = ex.type === "timed" || ex.type === "cardio";
        selectedExercises.push({
          exercise_id: ex.id,
          sets: 3,
          reps: isTimed ? 0 : 15,
          duration_seconds: isTimed ? 60 : 0,
          weight: 0,
          rest_seconds: 90,
          exerciseData: ex,
        });
      });
    });

    const routineData = {
      name: config.name,
      type: config.type,
      split: config.split,
      exercises: selectedExercises,
    };

    try {
      await createRoutine(user.uid, routineData);
      await loadData();
    } catch (error) {
      console.error("Error creating routine:", error);
      toast.error("Failed to create routine");
    }
  };

  const routineColors = [
    {
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
      color: "#FF6B6B",
      glow: "rgba(255, 107, 107, 0.4)",
    },
    {
      gradient: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
      color: "#4ECDC4",
      glow: "rgba(78, 205, 196, 0.4)",
    },
    {
      gradient: "linear-gradient(135deg, #FFD93D 0%, #F5C000 100%)",
      color: "#FFD93D",
      glow: "rgba(255, 217, 61, 0.4)",
    },
    {
      gradient: "linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)",
      color: "#A8E6CF",
      glow: "rgba(168, 230, 207, 0.4)",
    },
    {
      gradient: "linear-gradient(135deg, #FFB6B9 0%, #FFA5A8 100%)",
      color: "#FFB6B9",
      glow: "rgba(255, 182, 185, 0.4)",
    },
    {
      gradient: "linear-gradient(135deg, #B19CD9 0%, #9B7EC4 100%)",
      color: "#B19CD9",
      glow: "rgba(177, 156, 217, 0.4)",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <span
          className="material-icons rotating"
          style={{ fontSize: "48px", color: "#666" }}
        >
          sync
        </span>
        <p style={{ color: "#999", marginTop: "16px" }}>Loading routines...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .routines-header h2 {
            font-size: 36px !important;
          }
          .routines-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .routine-card {
            padding: 16px !important;
          }
          .exercise-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .workout-controls {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .workout-controls button {
            width: 100% !important;
          }
          /* Fix Active Workout Modal - Sets/Reps/Weight layout */
          .workout-stats-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .workout-stats-grid > div:first-child {
            grid-column: span 2 !important;
            text-align: center !important;
          }
          .workout-stats-grid > div:nth-child(2),
          .workout-stats-grid > div:nth-child(3) {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .workout-stats-grid div[style*="display: flex"][style*="gap: 8px"] {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .workout-stat-value {
            font-size: 28px !important;
          }
          div[style*="fontSize: 48px"] {
            font-size: 28px !important;
          }
          div[style*="minWidth: 120px"] {
            min-width: 50px !important;
          }
          .workout-live-stats {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 6px !important;
          }
          .workout-live-stats > div {
            padding: 6px 4px !important;
          }
          /* Workout modal header */
          .workout-modal-header h3 {
            font-size: 18px !important;
          }
          .workout-modal-header p {
            font-size: 14px !important;
          }
          .workout-modal-header button {
            width: 36px !important;
            height: 36px !important;
          }
          /* Exercise card in workout modal */
          .exercise-card-name {
            font-size: 22px !important;
          }
          /* Fix Predefined Routines Modal cards */
          .predefined-routines-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          .predefined-routine-card {
            min-width: unset !important;
          }
          /* Modal padding adjustments */
          .modal-content-padding {
            padding: 16px !important;
          }
        }
      `}</style>

      <div
        className="routines-header"
        style={{ marginBottom: "40px", animation: "fadeIn 0.5s ease-out" }}
      >
        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "56px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background:
              "linear-gradient(135deg, #A8E6CF 0%, #4ECDC4 35%, #88D8B0 70%, #66D9A5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ROUTINE HUB
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            className="material-icons"
            style={{ fontSize: "20px", color: "#A8E6CF" }}
          >
            fitness_center
          </span>
          Build and manage your workout programs
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <ActionButton
          icon="add_circle"
          label="Create Routine"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          glow="rgba(102, 126, 234, 0.4)"
          onClick={() => navigate("/create-routine")}
        />
        <ActionButton
          icon="delete_sweep"
          label="Delete All"
          gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)"
          glow="rgba(255, 107, 107, 0.4)"
          onClick={handleDeleteAllRoutines}
        />
      </div>

      {/* Saved/In-Progress Workouts - MOVED TO TOP */}
      {savedWorkout &&
        Array.isArray(savedWorkout) &&
        savedWorkout.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "#A8E6CF",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span className="material-icons" style={{ fontSize: "32px" }}>
                play_circle
              </span>
              WORKOUTS IN PROGRESS
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "16px",
              }}
            >
              {savedWorkout.map(
                (workout, idx) =>
                  workout.routine && (
                    <div
                      key={idx}
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(168, 230, 207, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)",
                        border: "2px solid #A8E6CF",
                        borderRadius: "20px",
                        padding: "20px",
                        animation: "pulse 2s ease-in-out infinite",
                        boxShadow: "0 8px 30px rgba(168, 230, 207, 0.3)",
                      }}
                    >
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: "24px", color: "#A8E6CF" }}
                          >
                            play_circle
                          </span>
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#fff",
                              fontFamily: "Bebas Neue, Impact, sans-serif",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {workout.routineName || workout.routine.name}
                          </h4>
                        </div>
                        <p style={{ fontSize: "13px", color: "#999" }}>
                          Exercise {(workout.currentExerciseIndex || 0) + 1} of{" "}
                          {workout.routine.exercises?.length || 0} • Set{" "}
                          {workout.currentSet || 1} •
                          {workout.completedSets?.length || 0} sets completed
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          workout.isResume = true;
                          setActiveWorkout(workout);
                        }}
                        style={{
                          width: "100%",
                          padding: "14px 20px",
                          background:
                            "linear-gradient(135deg, #A8E6CF 0%, #4ECDC4 100%)",
                          border: "none",
                          borderRadius: "12px",
                          color: "#000",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          boxShadow: "0 4px 15px rgba(168, 230, 207, 0.4)",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          play_arrow
                        </span>
                        Resume Workout
                      </button>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

      {/* Active Program - Current Day */}
      {activeProgram && currentDayRoutine && (
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, #FFD93D20 0%, #FFD93D10 100%)",
              border: "2px solid #FFD93D",
              borderRadius: "16px",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#FFD93D",
                color: "#000",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              PROGRAMS
            </div>

            <h3
              style={{
                fontSize: "32px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#FFD93D",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              {currentDayRoutine.programName}
            </h3>

            <p
              style={{ color: "#999", fontSize: "14px", marginBottom: "24px" }}
            >
              Day {currentDayRoutine.currentDay} of{" "}
              {currentDayRoutine.totalDays} • {currentDayRoutine.name}
            </p>

            <div
              style={{
                background: "#0a0a0a",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                Today's Workout: {currentDayRoutine.name}
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {currentDayRoutine.exercises.slice(0, 5).map((ex, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    <span>{ex.name}</span>
                    <span style={{ color: "#FFD93D", fontWeight: 600 }}>
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
                {currentDayRoutine.exercises.length > 5 && (
                  <div
                    style={{
                      color: "#666",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    +{currentDayRoutine.exercises.length - 5} more exercises
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  handleStartWorkout({
                    name: currentDayRoutine.name,
                    exercises: currentDayRoutine.exercises,
                    muscleGroups: currentDayRoutine.muscleGroups,
                    isProgramDay: true,
                  });
                }}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background:
                    "linear-gradient(135deg, #FFD93D 0%, #FFC93D 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#000",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span className="material-icons">play_arrow</span>
                Start Today's Workout
              </button>

              <button
                onClick={async () => {
                  if (confirm("Skip to next day? Your progress will be saved.")) {
                    await completeCurrentDay(user.uid);
                    toast.showToast("Moved to next day", "success");
                    loadData();
                  }
                }}
                style={{
                  padding: "14px 24px",
                  background: "#0a0a0a",
                  border: "2px solid #4ECDC4",
                  borderRadius: "12px",
                  color: "#4ECDC4",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  skip_next
                </span>
                Skip Day
              </button>

              <button
                onClick={async () => {
                  if (confirm("Stop this active program?")) {
                    await deactivateProgram(activeProgram.id);
                    toast.showToast("Program stopped", "info");
                    loadData();
                  }
                }}
                style={{
                  padding: "14px 24px",
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  color: "#999",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Stop Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Workouts Today */}
      {completedWorkouts.length > 0 && (
        <div style={{ marginBottom: "48px" }}>
          <h3
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#4ECDC4",
              fontFamily: "Bebas Neue, Impact, sans-serif",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span className="material-icons" style={{ fontSize: "32px" }}>
              check_circle
            </span>
            COMPLETED TODAY
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {completedWorkouts.map((routineName, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 20px",
                  background:
                    "linear-gradient(135deg, #4ECDC420 0%, #44A08D20 100%)",
                  border: "2px solid #4ECDC4",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#4ECDC4",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                <span className="material-icons" style={{ fontSize: "20px" }}>
                  fitness_center
                </span>
                {routineName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Routines Section */}
      <div>
        <h3
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "20px",
            color: "#4ECDC4",
            fontFamily: "Bebas Neue, Impact, sans-serif",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span className="material-icons" style={{ fontSize: "32px" }}>
            add_circle
          </span>
          MY ROUTINES
        </h3>

        {routines.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {routines.map((routine, index) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                colors={routineColors[index % routineColors.length]}
                onView={() => setSelectedRoutine(routine)}
                onEdit={() => setEditingRoutine(routine)}
                onDelete={() => handleDeleteRoutine(routine.id)}
                onDuplicate={() => handleDuplicateRoutine(routine.id)}
                bodyWeight={profile?.body_weight_kg || 75}
              />
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || editingRoutine) && (
        <RoutineModal
          routine={editingRoutine}
          exercises={exercises}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRoutine(null);
          }}
          onSave={handleSaveRoutine}
          bodyWeight={profile?.body_weight_kg || 75}
        />
      )}

      {selectedRoutine && (
        <ViewRoutineModal
          routine={selectedRoutine}
          exercises={exercises}
          onClose={() => setSelectedRoutine(null)}
          onEdit={() => {
            setEditingRoutine(selectedRoutine);
            setSelectedRoutine(null);
          }}
          onStartWorkout={handleStartWorkout}
          bodyWeight={profile?.body_weight_kg || 75}
        />
      )}

      {activeWorkout && (
        <ActiveWorkoutModal
          workout={activeWorkout}
          user={user}
          profile={profile}
          onClose={() => {
            setActiveWorkout(null);
            checkForSavedWorkout();
          }}
          onComplete={async () => {
            toast.success("Workout completed! All exercises logged.");
            setActiveWorkout(null);
            setSavedWorkout(null);
            await loadData();
          }}
        />
      )}

      {showPredefinedModal && (
        <PredefinedRoutinesModal
          exercises={exercises}
          onClose={() => setShowPredefinedModal(false)}
          onSelectRoutine={async (routineData) => {
            await handleSaveRoutine(routineData);
            setShowPredefinedModal(false);
          }}
        />
      )}

      {/* Debug Info */}
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          background: "#1a1a1a",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "10px",
          color: "#fff",
          border: "1px solid #4ECDC4",
          zIndex: 9999,
          display: "none",
        }}
      >
        Create: {String(showCreateModal)} | Edit: {String(!!editingRoutine)} |
        Gen: {String(showGeneratorModal)} | View: {String(!!selectedRoutine)}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, gradient, glow, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 24px",
        background: gradient,
        border: "none",
        borderRadius: "12px",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        boxShadow: `0 4px 15px ${glow}`,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 20px ${glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 15px ${glow}`;
      }}
    >
      <span className="material-icons">{icon}</span>
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        borderRadius: "20px",
        border: "2px solid #2a2a2a",
      }}
    >
      <span
        className="material-icons"
        style={{ fontSize: "96px", color: "#2a2a2a", marginBottom: "24px" }}
      >
        fitness_center
      </span>
      <p style={{ color: "#999", fontSize: "18px", marginBottom: "12px" }}>
        No routines yet
      </p>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Create a custom routine or generate one automatically
      </p>
    </div>
  );
}

function RoutineCard({
  routine,
  colors,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  bodyWeight,
}) {
  const { totalCalories, totalDuration } = calculateRoutineStats(
    routine.exercises || [],
    bodyWeight
  );

  return (
    <div
      className="scale-in"
      style={{
        background: `radial-gradient(circle at top right, ${colors.color}08 0%, #0a0a0a 50%)`,
        border: `2px solid ${colors.color}30`,
        borderRadius: "20px",
        padding: "24px",
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 4px 20px ${colors.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.color;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 8px 30px ${colors.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${colors.color}30`;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 20px ${colors.glow}`;
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: colors.gradient,
        }}
      ></div>

      <div
        style={{ marginBottom: "16px", paddingLeft: "8px" }}
        onClick={onView}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: colors.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${colors.glow}`,
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: "24px", color: "#fff" }}
            >
              {routine.type === "home"
                ? "home"
                : routine.type === "gym"
                ? "fitness_center"
                : "edit"}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              {routine.name}
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {routine.type} • {routine.split || "Full Body"}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
          paddingLeft: "8px",
        }}
        onClick={onView}
      >
        <StatBox label="Exercises" value={(routine.exercises || []).length} />
        <StatBox label="Duration" value={`${totalDuration}m`} />
        <StatBox label="Calories" value={Math.round(totalCalories)} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "8px",
          paddingLeft: "8px",
        }}
      >
        <IconButton icon="play_arrow" onClick={onView} color={colors.color} />
        <IconButton icon="edit" onClick={onEdit} color="#4ECDC4" />
        <IconButton icon="content_copy" onClick={onDuplicate} color="#FFD93D" />
        <IconButton icon="delete" onClick={onDelete} color="#FF6B6B" />
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#fff",
          fontFamily: "Bebas Neue, Impact, sans-serif",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "#666",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function IconButton({ icon, onClick, color }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        padding: "10px",
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
        color: color,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}15`;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#0a0a0a";
        e.currentTarget.style.borderColor = "#2a2a2a";
      }}
    >
      <span className="material-icons" style={{ fontSize: "18px" }}>
        {icon}
      </span>
    </button>
  );
}

function calculateRoutineStats(exercises, bodyWeight) {
  let totalCalories = 0;
  let totalDuration = 0;

  exercises.forEach((ex) => {
    const exerciseData = ex.exerciseData || {};
    const isTimed =
      exerciseData.type === "timed" || exerciseData.type === "cardio";

    // Calculate duration for this exercise
    let exerciseDuration = 0;
    if (isTimed) {
      // For timed exercises, use duration_seconds
      exerciseDuration = ((ex.duration_seconds || 60) * ex.sets) / 60; // Convert to minutes
    } else {
      // For rep-based exercises, estimate 3 seconds per rep
      exerciseDuration = (ex.reps * 3 * ex.sets) / 60; // Convert to minutes
    }

    const calories = calculateExerciseCalories(
      {
        type: exerciseData.type,
        met: exerciseData.met,
        volumeCoefficient: exerciseData.volume_coefficient,
      },
      {
        bodyWeightKg: bodyWeight,
        durationMinutes: exerciseDuration,
        weightKg: ex.weight || 0,
        reps: ex.reps || 0,
        sets: ex.sets,
      }
    );

    totalCalories += calories.totalCalories;
    totalDuration += exerciseDuration + ex.sets * (ex.rest_seconds / 60);
  });

  return { totalCalories, totalDuration: Math.round(totalDuration) };
}

// Create/Edit Routine Modal
function RoutineModal({ routine, exercises, onClose, onSave, bodyWeight }) {
  const [name, setName] = useState(routine?.name || "");
  const [type, setType] = useState(routine?.type || "gym");
  const [split, setSplit] = useState(routine?.split || "Full Body");
  const [selectedExercises, setSelectedExercises] = useState(
    routine?.exercises || []
  );
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddExercise = (exercise) => {
    const isTimed = exercise.type === "timed" || exercise.type === "cardio";
    const newExercise = {
      exercise_id: exercise.id,
      sets: 3, // Default to 3 sets for all
      reps: isTimed ? 0 : 15, // Default to 15 reps for non-timed
      duration_seconds: isTimed ? 60 : 0,
      weight: 0,
      rest_seconds: 90,
      exerciseData: exercise,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
  };

  const handleRemoveExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: Number(value) };
    setSelectedExercises(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.warning("Please enter a routine name");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.warning("Please add at least one exercise");
      return;
    }

    onSave({ name: name.trim(), type, split, exercises: selectedExercises });
  };

  const filteredExercises = exercises.filter(
    (ex) =>
      !selectedExercises.some((sel) => sel.exercise_id === ex.id) &&
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { totalCalories, totalDuration } = calculateRoutineStats(
    selectedExercises,
    bodyWeight
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRadius: "24px",
          border: "2px solid #2a2a2a",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "2px solid #2a2a2a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontFamily: "Bebas Neue, Impact, sans-serif",
              letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {routine ? "EDIT ROUTINE" : "CREATE ROUTINE"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: "24px",
            }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Routine Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workout Routine"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="gym">Gym</option>
                <option value="home">Home</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Split
              </label>
              <select
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="Full Body">Full Body</option>
                <option value="Upper Body">Upper Body</option>
                <option value="Lower Body">Lower Body</option>
                <option value="Push">Push</option>
                <option value="Pull">Pull</option>
                <option value="Legs">Legs</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          {selectedExercises.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Selected Exercises ({selectedExercises.length})
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ fontSize: "16px", color: "#FF6B6B" }}
                  >
                    local_fire_department
                  </span>
                  <span>{Math.round(totalCalories)} cal</span>
                  <span>⏱️ {totalDuration} min</span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {selectedExercises.map((ex, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#0a0a0a",
                      border: "2px solid #2a2a2a",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#fff",
                          marginBottom: "12px",
                        }}
                      >
                        {ex.exerciseData?.name || "Unknown Exercise"}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            ex.exerciseData?.type === "timed" ||
                            ex.exerciseData?.type === "cardio"
                              ? "repeat(3, 1fr)"
                              : "repeat(4, 1fr)",
                          gap: "12px",
                        }}
                      >
                        {ex.exerciseData?.type === "timed" ||
                        ex.exerciseData?.type === "cardio" ? (
                          <>
                            <InputField
                              label="Sets"
                              value={ex.sets}
                              onChange={(v) =>
                                handleUpdateExercise(index, "sets", v)
                              }
                            />
                            <InputField
                              label="Duration (s)"
                              value={ex.duration_seconds || 60}
                              onChange={(v) =>
                                handleUpdateExercise(
                                  index,
                                  "duration_seconds",
                                  v
                                )
                              }
                            />
                            <InputField
                              label="Rest (s)"
                              value={ex.rest_seconds}
                              onChange={(v) =>
                                handleUpdateExercise(index, "rest_seconds", v)
                              }
                            />
                          </>
                        ) : (
                          <>
                            <InputField
                              label="Sets"
                              value={ex.sets}
                              onChange={(v) =>
                                handleUpdateExercise(index, "sets", v)
                              }
                            />
                            <InputField
                              label="Reps"
                              value={ex.reps}
                              onChange={(v) =>
                                handleUpdateExercise(index, "reps", v)
                              }
                            />
                            <InputField
                              label="Weight (kg)"
                              value={ex.weight}
                              onChange={(v) =>
                                handleUpdateExercise(index, "weight", v)
                              }
                            />
                            <InputField
                              label="Rest (s)"
                              value={ex.rest_seconds}
                              onChange={(v) =>
                                handleUpdateExercise(index, "rest_seconds", v)
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF6B6B",
                        cursor: "pointer",
                        padding: "8px",
                      }}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4
              style={{
                fontSize: "14px",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
              }}
            >
              Add Exercises
            </h4>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises..."
              style={{
                width: "100%",
                padding: "12px",
                background: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            />
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {filteredExercises.slice(0, 10).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  style={{
                    padding: "12px",
                    background: "#0a0a0a",
                    border: "2px solid #2a2a2a",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#4ECDC4";
                    e.currentTarget.style.background = "#4ECDC410";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2a2a";
                    e.currentTarget.style.background = "#0a0a0a";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {ex.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {ex.body_part}
                    </div>
                  </div>
                  <span
                    className="material-icons"
                    style={{ color: "#4ECDC4", fontSize: "20px" }}
                  >
                    add_circle
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderTop: "2px solid #2a2a2a",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              background: "#2a2a2a",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)",
            }}
          >
            Save Routine
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          color: "#666",
          marginBottom: "4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || /^\d*\.?\d*$/.test(val)) {
            onChange(val);
          }
        }}
        style={{
          width: "100%",
          padding: "8px",
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "13px",
        }}
      />
    </div>
  );
}

// Generator Modal
function GeneratorModal({ exercises, onClose, onGenerate, bodyWeight }) {
  const [goal, setGoal] = useState("muscle_gain");
  const [experience, setExperience] = useState("intermediate");
  const [equipment, setEquipment] = useState("gym");
  const [split, setSplit] = useState("full_body");

  const handleGenerate = () => {
    const generatedRoutine = generateRoutine(
      exercises,
      goal,
      experience,
      equipment,
      split
    );
    onGenerate(generatedRoutine);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRadius: "24px",
          border: "2px solid #2a2a2a",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "2px solid #2a2a2a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "24px",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "4px",
              }}
            >
              AI ROUTINE GENERATOR
            </h3>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Auto-create routines based on your goals
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: "24px",
            }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#999",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Primary Goal
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <OptionCard
                icon="local_fire_department"
                label="Fat Loss"
                description="Higher reps, shorter rest"
                selected={goal === "fat_loss"}
                onClick={() => setGoal("fat_loss")}
                color="#FF6B6B"
              />
              <OptionCard
                icon="fitness_center"
                label="Muscle Gain"
                description="Progressive overload focus"
                selected={goal === "muscle_gain"}
                onClick={() => setGoal("muscle_gain")}
                color="#4ECDC4"
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#999",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Experience Level
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              {[
                { value: "beginner", label: "Beginner", icon: "star_outline" },
                {
                  value: "intermediate",
                  label: "Intermediate",
                  icon: "star_half",
                },
                { value: "advanced", label: "Advanced", icon: "star" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  style={{
                    padding: "12px",
                    background:
                      experience === opt.value
                        ? "linear-gradient(135deg, #FFD93D 0%, #F5C000 100%)"
                        : "#0a0a0a",
                    border:
                      experience === opt.value ? "none" : "2px solid #2a2a2a",
                    borderRadius: "12px",
                    color: experience === opt.value ? "#000" : "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#999",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Equipment Available
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              {[
                { value: "home", label: "Home", icon: "home" },
                { value: "minimal", label: "Minimal", icon: "handyman" },
                { value: "gym", label: "Full Gym", icon: "fitness_center" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEquipment(opt.value)}
                  style={{
                    padding: "12px",
                    background:
                      equipment === opt.value
                        ? "linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)"
                        : "#0a0a0a",
                    border:
                      equipment === opt.value ? "none" : "2px solid #2a2a2a",
                    borderRadius: "12px",
                    color: equipment === opt.value ? "#000" : "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s",
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#999",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Workout Split
            </label>
            <select
              value={split}
              onChange={(e) => setSplit(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "14px",
              }}
            >
              <option value="full_body">Full Body</option>
              <option value="upper_lower">Upper/Lower</option>
              <option value="push_pull_legs">Push/Pull/Legs</option>
            </select>
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderTop: "2px solid #2a2a2a",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              background: "#2a2a2a",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "0 4px 15px rgba(78, 205, 196, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="material-icons">auto_awesome</span>
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ icon, label, description, selected, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "16px",
        background: selected
          ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
          : "#0a0a0a",
        border: selected ? "none" : "2px solid #2a2a2a",
        borderRadius: "12px",
        color: selected ? "#fff" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        className="material-icons"
        style={{ fontSize: "32px", color: selected ? "#fff" : color }}
      >
        {icon}
      </span>
      <div style={{ fontWeight: 700, fontSize: "14px" }}>{label}</div>
      <div style={{ fontSize: "11px", opacity: 0.8 }}>{description}</div>
    </button>
  );
}

// View Routine Modal
function ViewRoutineModal({
  routine,
  exercises,
  onClose,
  onEdit,
  onStartWorkout,
  bodyWeight,
}) {
  const { totalCalories, totalDuration } = calculateRoutineStats(
    routine.exercises || [],
    bodyWeight
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRadius: "24px",
          border: "2px solid #2a2a2a",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "2px solid #2a2a2a",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: "28px",
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                  letterSpacing: "0.05em",
                  color: "#fff",
                  marginBottom: "8px",
                }}
              >
                {routine.name}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: "16px", color: "#4ECDC4" }}
                >
                  place
                </span>
                <span>{routine.type}</span>
                <span
                  className="material-icons"
                  style={{ fontSize: "16px", color: "#A8E6CF" }}
                >
                  fitness_center
                </span>
                <span>{routine.split}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "24px",
              }}
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
                padding: "12px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {(routine.exercises || []).length}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.9,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Exercises
              </div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                padding: "12px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {totalDuration}m
              </div>
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.9,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Duration
              </div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #FFD93D 0%, #F5C000 100%)",
                padding: "12px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {Math.round(totalCalories)}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.9,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Calories
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          <h4
            style={{
              fontSize: "14px",
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "16px",
            }}
          >
            Exercises ({(routine.exercises || []).length})
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {(routine.exercises || []).map((ex, index) => (
              <div
                key={index}
                style={{
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  padding: "16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "4px",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                  }}
                ></div>
                <div style={{ paddingLeft: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {index + 1}.{" "}
                        {ex.exerciseData?.name || "Unknown Exercise"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#666" }}>
                        {ex.exerciseData?.body_part} • {ex.exerciseData?.type}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#4ECDC4",
                          fontFamily: "Bebas Neue, Impact, sans-serif",
                        }}
                      >
                        {ex.sets}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          textTransform: "uppercase",
                        }}
                      >
                        Sets
                      </div>
                    </div>
                    {ex.exerciseData?.type === "timed" ||
                    ex.exerciseData?.type === "cardio" ? (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#FFD93D",
                            fontFamily: "Bebas Neue, Impact, sans-serif",
                          }}
                        >
                          {ex.duration_seconds || 60}s
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#666",
                            textTransform: "uppercase",
                          }}
                        >
                          Duration
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#FFD93D",
                              fontFamily: "Bebas Neue, Impact, sans-serif",
                            }}
                          >
                            {ex.reps}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#666",
                              textTransform: "uppercase",
                            }}
                          >
                            Reps
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#FF6B6B",
                              fontFamily: "Bebas Neue, Impact, sans-serif",
                            }}
                          >
                            {ex.weight}kg
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#666",
                              textTransform: "uppercase",
                            }}
                          >
                            Weight
                          </div>
                        </div>
                      </>
                    )}
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#A8E6CF",
                          fontFamily: "Bebas Neue, Impact, sans-serif",
                        }}
                      >
                        {ex.rest_seconds}s
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          textTransform: "uppercase",
                        }}
                      >
                        Rest
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderTop: "2px solid #2a2a2a",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: "14px",
              background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(78, 205, 196, 0.4)",
            }}
          >
            <span className="material-icons">edit</span>
            Edit Routine
          </button>
          <button
            onClick={() => onStartWorkout(routine)}
            style={{
              flex: 1,
              padding: "14px",
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)",
            }}
          >
            <span className="material-icons">play_arrow</span>
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}

// Routine Generator Algorithm
function generateRoutine(exercises, goal, experience, equipment, split) {
  const muscleGroups = {
    full_body: [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "legs",
      "core",
    ],
    upper_lower:
      split === "upper"
        ? ["chest", "back", "shoulders", "biceps", "triceps"]
        : ["legs", "core"],
    push_pull_legs:
      split === "push"
        ? ["chest", "shoulders", "triceps"]
        : split === "pull"
        ? ["back", "biceps"]
        : ["legs", "core"],
  };

  const targetGroups = muscleGroups[split] || muscleGroups.full_body;

  const configs = {
    fat_loss: { sets: 3, reps: 15, rest: 45 },
    muscle_gain: { sets: 4, reps: 8, rest: 90 },
  };

  const config = configs[goal] || configs.muscle_gain;

  if (experience === "beginner") {
    config.sets = Math.max(2, config.sets - 1);
    config.rest += 15;
  } else if (experience === "advanced") {
    config.sets += 1;
  }

  const filteredExercises = exercises.filter((ex) => {
    const bodyPart = (ex.body_part || "").toLowerCase();
    return targetGroups.some((group) => bodyPart.includes(group));
  });

  const selectedExercises = [];
  const exercisesPerGroup = Math.max(1, Math.floor(6 / targetGroups.length));

  targetGroups.forEach((group) => {
    const groupExercises = filteredExercises.filter((ex) =>
      (ex.body_part || "").toLowerCase().includes(group)
    );

    const selected = groupExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, exercisesPerGroup);

    selected.forEach((ex) => {
      const isTimed = ex.type === "timed" || ex.type === "cardio";
      selectedExercises.push({
        exercise_id: ex.id,
        sets: config.sets,
        reps: isTimed ? 0 : config.reps,
        duration_seconds: isTimed ? 60 : 0,
        weight: 0,
        rest_seconds: config.rest,
        exerciseData: ex,
      });
    });
  });

  const routineName = `${
    experience.charAt(0).toUpperCase() + experience.slice(1)
  } ${
    split === "full_body"
      ? "Full Body"
      : split === "upper_lower"
      ? "Upper/Lower"
      : "PPL"
  } - ${goal === "fat_loss" ? "Fat Loss" : "Muscle Gain"}`;

  return {
    name: routineName,
    type: equipment,
    split:
      split === "full_body"
        ? "Full Body"
        : split === "upper_lower"
        ? "Upper/Lower"
        : "PPL",
    exercises: selectedExercises,
  };
}

// Active Workout Modal
function ActiveWorkoutModal({ workout, user, profile, onClose, onComplete }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [exerciseStates, setExerciseStates] = useState({});
  const [skippedSets, setSkippedSets] = useState([]);
  const [showToast, setShowToast] = useState(null);

  // Initialize or restore session state from Firebase
  useEffect(() => {
    const initializeSession = async () => {
      if (workout.isResume && workout.sessionId) {
        // Resuming saved workout - restore state and DON'T pause
        setCurrentExerciseIndex(workout.currentExerciseIndex || 0);
        setCurrentSet(workout.currentSet || 1);
        setCompletedSets(workout.completedSets || []);
        setSessionId(workout.sessionId);
        setExerciseStates(workout.exerciseStates || {});
        setSkippedSets(workout.skippedSets || []);
        setIsPaused(false); // Don't auto-pause on resume
        return;
      }

      // Create new session if starting fresh
      try {
        const sid = await createWorkoutSession(user.uid, {
          date: getLocalDateString(),
          routineName: workout.routine.name,
        });
        setSessionId(sid);

        // Initialize exercise states with default values
        const initialStates = {};
        workout.routine.exercises.forEach((ex, idx) => {
          initialStates[idx] = {
            weight: ex.weight || 0,
            reps: ex.reps || 15,
            duration_seconds: ex.duration_seconds || 60,
          };
        });
        setExerciseStates(initialStates);
      } catch (error) {
        console.error("Error creating session:", error);
      }
    };

    initializeSession();
  }, []);

  // Save session state to Firebase whenever it changes
  useEffect(() => {
    if (sessionId) {
      const saveProgress = async () => {
        try {
          await saveWorkoutProgress(user.uid, workout.routine.name, {
            sessionId,
            currentExerciseIndex,
            currentSet,
            completedSets,
            exerciseStates,
            skippedSets,
          });
        } catch (error) {
          console.error("Error saving workout progress:", error);
        }
      };
      saveProgress();
    }
  }, [
    sessionId,
    currentExerciseIndex,
    currentSet,
    completedSets,
    exerciseStates,
    skippedSets,
  ]);

  const currentExercise = workout.routine.exercises[currentExerciseIndex];
  const totalExercises = workout.routine.exercises.length;

  // Calculate completed exercises
  const completedExercises = currentExerciseIndex;
  const remainingExercises = totalExercises - completedExercises - 1;
  const progress = ((completedExercises / totalExercises) * 100).toFixed(0);

  // Get current exercise state
  const currentState = exerciseStates[currentExerciseIndex] || {
    weight: currentExercise?.weight || 0,
    reps: currentExercise?.reps || 15,
    duration_seconds: currentExercise?.duration_seconds || 60,
  };

  // Live edit handlers
  const adjustWeight = (delta) => {
    setExerciseStates({
      ...exerciseStates,
      [currentExerciseIndex]: {
        ...currentState,
        weight: Math.max(0, currentState.weight + delta),
      },
    });
  };

  const adjustReps = (delta) => {
    setExerciseStates({
      ...exerciseStates,
      [currentExerciseIndex]: {
        ...currentState,
        reps: Math.max(1, currentState.reps + delta),
      },
    });
  };

  const adjustTime = (delta) => {
    setExerciseStates({
      ...exerciseStates,
      [currentExerciseIndex]: {
        ...currentState,
        duration_seconds: Math.max(10, currentState.duration_seconds + delta),
      },
    });
  };

  const showToastMessage = (message, duration = 2000) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), duration);
  };

  const handleSkipSet = () => {
    const skipData = {
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
      timestamp: new Date(),
    };
    setSkippedSets([...skippedSets, skipData]);
    showToastMessage(`Set ${currentSet} skipped`);

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      } else {
        onComplete();
      }
    }
  };

  const handleSkipExercise = async () => {
    if (
      !confirm(
        `Skip all remaining sets of ${currentExercise?.exerciseData?.name}?`
      )
    )
      return;

    // Mark all remaining sets as skipped
    const newSkippedSets = [...skippedSets];
    for (let i = currentSet; i <= currentExercise.sets; i++) {
      newSkippedSets.push({
        exerciseIndex: currentExerciseIndex,
        set: i,
        timestamp: new Date(),
      });
    }
    setSkippedSets(newSkippedSets);

    // Log the exercise if there were any completed sets
    const completedSetsForExercise = completedSets.filter(
      (s) => s.exerciseIndex === currentExerciseIndex
    );
    const skippedSetsForExercise = newSkippedSets.filter(
      (s) => s.exerciseIndex === currentExerciseIndex
    );

    if (completedSetsForExercise.length > 0) {
      try {
        const exercise = currentExercise;
        const isTimed =
          exercise.exerciseData?.type === "timed" ||
          exercise.exerciseData?.type === "cardio";

        // Calculate averages from completed sets
        const completedCount = completedSetsForExercise.length;
        let avgWeight = 0;
        let avgReps = 0;
        let avgDuration = 0;

        if (completedCount > 0) {
          let totalWeight = 0;
          let totalReps = 0;
          let totalDuration = 0;

          completedSetsForExercise.forEach((s) => {
            totalWeight += s.weight || 0;
            totalReps += s.reps || 0;
            totalDuration += s.duration_seconds || 0;
          });

          avgWeight = totalWeight / completedCount;
          avgReps = Math.round(totalReps / completedCount);
          avgDuration = Math.round(totalDuration / completedCount);
        }

        // Calculate duration for completed sets only
        let exerciseDuration = 0;
        if (isTimed) {
          exerciseDuration = (avgDuration * completedCount) / 60;
        } else {
          exerciseDuration = (avgReps * 3 * completedCount) / 60;
        }

        // Calculate calories using averages from completed sets
        const calories = calculateExerciseCalories(
          {
            type: exercise.exerciseData?.type,
            met: exercise.exerciseData?.met,
            volumeCoefficient: exercise.exerciseData?.volume_coefficient,
          },
          {
            bodyWeightKg: profile?.body_weight_kg || 75,
            durationMinutes: exerciseDuration,
            weightKg: avgWeight,
            reps: avgReps,
            sets: completedCount,
          }
        );

        // Log the exercise with completed and skipped data
        if (sessionId) {
          await logExercise(user.uid, {
            sessionId,
            exerciseId: exercise.exercise_id,
            exerciseName:
              exercise.name ||
              exercise.exerciseData?.name ||
              currentExercise?.exerciseData?.name ||
              "Unknown Exercise",
            muscleGroup:
              exercise.muscleGroup ||
              exercise.exerciseData?.muscleGroup ||
              exercise.exerciseData?.category ||
              currentExercise?.exerciseData?.muscleGroup ||
              "unknown",
            sets: completedCount,
            skippedSets: skippedSetsForExercise.length,
            reps: isTimed ? 0 : avgReps,
            weightKg: isTimed ? 0 : avgWeight,
            durationMinutes: isTimed ? exerciseDuration : 0,
            durationSeconds: isTimed ? avgDuration : 0,
            caloriesBurned: calories.totalCalories,
            volume: calories.volume || 0,
            date: getLocalDateString(),
          });

          // Check for personal record (only for strength exercises with weight)
          if (!isTimed && avgWeight > 0 && exercise.exerciseData?.type !== 'cardio') {
            try {
              const exerciseId = exercise.exerciseData?.id || exercise.exercise_id || exercise.id;
              const exerciseName = exercise.name || exercise.exerciseData?.name || "Unknown Exercise";
              
              const prResult = await checkAndUpdatePR(
                user.uid,
                exerciseId,
                exerciseName,
                avgWeight,
                avgReps,
                completedCount
              );
              
              if (prResult?.isNewPR) {
                showToastMessage(`🏆 New PR! ${prResult.prType.join(', ')}`);
              }
            } catch (prError) {
              console.error("Error checking PR:", prError);
            }
          }
        }
      } catch (error) {
        console.error("Error logging skipped exercise:", error);
      }
    }

    showToastMessage(`${currentExercise?.exerciseData?.name} skipped`);

    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
    } else {
      // Workout complete - delete this specific routine's progress from Firebase
      try {
        await deleteWorkoutProgress(user.uid, workout.routine.name);
      } catch (error) {
        console.error("Error deleting workout progress:", error);
      }
      onComplete();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCompleteSet = async () => {
    const setData = {
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
      timestamp: new Date(),
      weight: currentState.weight,
      reps: currentState.reps,
      duration_seconds: currentState.duration_seconds,
    };

    setCompletedSets([...completedSets, setData]);

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
    } else {
      // All sets for this exercise completed - LOG IT NOW
      try {
        const exercise = currentExercise;
        const isTimed =
          exercise.exerciseData?.type === "timed" ||
          exercise.exerciseData?.type === "cardio";

        // Get all completed sets for this exercise
        const completedSetsForExercise = completedSets.filter(
          (s) => s.exerciseIndex === currentExerciseIndex
        );
        const skippedSetsForExercise = skippedSets.filter(
          (s) => s.exerciseIndex === currentExerciseIndex
        );

        // Calculate averages from completed sets
        const completedCount = completedSetsForExercise.length + 1; // +1 for current set
        let avgWeight = 0;
        let avgReps = 0;
        let avgDuration = 0;

        if (completedCount > 0) {
          let totalWeight = currentState.weight;
          let totalReps = currentState.reps;
          let totalDuration = currentState.duration_seconds;

          completedSetsForExercise.forEach((s) => {
            totalWeight += s.weight || 0;
            totalReps += s.reps || 0;
            totalDuration += s.duration_seconds || 0;
          });

          avgWeight = totalWeight / completedCount;
          avgReps = Math.round(totalReps / completedCount);
          avgDuration = Math.round(totalDuration / completedCount);
        }

        // Calculate duration for completed sets only
        let exerciseDuration = 0;
        if (isTimed) {
          exerciseDuration = (avgDuration * completedCount) / 60;
        } else {
          exerciseDuration = (avgReps * 3 * completedCount) / 60;
        }

        // Calculate calories using averages from completed sets
        const calories = calculateExerciseCalories(
          {
            type: exercise.exerciseData?.type,
            met: exercise.exerciseData?.met,
            volumeCoefficient: exercise.exerciseData?.volume_coefficient,
          },
          {
            bodyWeightKg: profile?.body_weight_kg || 75,
            durationMinutes: exerciseDuration,
            weightKg: avgWeight,
            reps: avgReps,
            sets: completedCount,
          }
        );

        // Log the exercise immediately with actual completed/skipped data
        if (sessionId) {
          // Debug logging
          console.log("=== LOGGING EXERCISE ===");
          console.log("currentExercise:", currentExercise);
          console.log("exercise (from loop):", exercise);
          console.log("exerciseName being logged:", 
              currentExercise?.exerciseData?.name ||
              currentExercise?.name ||
              exercise.name ||
              exercise.exerciseData?.name ||
              "Unknown Exercise"
          );
          
          await logExercise(user.uid, {
            sessionId,
            exerciseId:
              currentExercise?.exerciseData?.id ||
              currentExercise?.exerciseId ||
              currentExercise?.name ||
              exercise.exerciseId ||
              exercise.exercise_id ||
              exercise.exerciseData?.id,
            exerciseName:
              currentExercise?.exerciseData?.name ||
              currentExercise?.name ||
              exercise.name ||
              exercise.exerciseData?.name ||
              "Unknown Exercise",
            muscleGroup:
              currentExercise?.exerciseData?.muscleGroup ||
              currentExercise?.muscleGroup ||
              currentExercise?.exerciseData?.category ||
              exercise.muscleGroup ||
              exercise.exerciseData?.muscleGroup ||
              exercise.exerciseData?.category ||
              "unknown",
            sets: completedCount,
            skippedSets: skippedSetsForExercise.length,
            reps: isTimed ? 0 : avgReps,
            weightKg: isTimed ? 0 : avgWeight,
            durationMinutes: isTimed ? exerciseDuration : 0,
            durationSeconds: isTimed ? avgDuration : 0,
            caloriesBurned: calories.totalCalories,
            volume: calories.volume || 0,
            date: getLocalDateString(),
          });

          // Check for Personal Record (PR) - only for strength exercises with weight
          if (!isTimed && avgWeight > 0) {
            const exerciseId =
              currentExercise?.exerciseData?.id ||
              currentExercise?.exerciseId ||
              currentExercise?.name ||
              exercise.exerciseId ||
              exercise.exercise_id ||
              exercise.exerciseData?.id;
            const exerciseName =
              currentExercise?.exerciseData?.name ||
              currentExercise?.name ||
              exercise.name ||
              exercise.exerciseData?.name ||
              "Unknown Exercise";

            try {
              const prResult = await checkAndUpdatePR(
                user.uid,
                exerciseId,
                exerciseName,
                avgWeight,
                avgReps,
                completedCount
              );

              if (prResult.isNewPR) {
                showToastMessage(
                  `🏆 New PR! ${prResult.prType.join(", ")} for ${exerciseName}!`
                );
              }
            } catch (prError) {
              console.error("Error checking PR:", prError);
            }
          }
        }
      } catch (error) {
        console.error("Error logging exercise:", error);
      }

      // Move to next exercise or finish
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      } else {
        // Workout complete - delete this specific routine's progress from Firebase
        try {
          await deleteWorkoutProgress(user.uid, workout.routine.name);

          // If this is a program day, advance to next day
          if (workout.routine.isProgramDay) {
            await completeCurrentDay(user.uid);
          }
        } catch (error) {
          console.error("Error deleting workout progress:", error);
        }
        onComplete();
      }
    }
  };

  const isTimed =
    currentExercise?.exerciseData?.type === "timed" ||
    currentExercise?.exerciseData?.type === "cardio";

  // Calculate live stats based on completed sets and current values
  const calculateLiveStats = () => {
    let totalCalories = 0;
    let totalVolume = 0;
    let totalDuration = 0;

    workout.routine.exercises.forEach((ex, idx) => {
      const state = exerciseStates[idx] || {
        weight: ex.weight || 0,
        reps: ex.reps || 15,
        duration_seconds: ex.duration_seconds || 60,
      };

      const exerciseIsTimed =
        ex.exerciseData?.type === "timed" || ex.exerciseData?.type === "cardio";

      // Calculate completed sets for this exercise
      const completedSetsForExercise = completedSets.filter(
        (s) => s.exerciseIndex === idx
      ).length;
      const skippedSetsForExercise = skippedSets.filter(
        (s) => s.exerciseIndex === idx
      ).length;
      const effectiveSets =
        idx < currentExerciseIndex
          ? ex.sets
          : idx === currentExerciseIndex
          ? completedSetsForExercise
          : 0;

      if (effectiveSets === 0) return;

      // Calculate duration for completed sets
      let exerciseDuration = 0;
      if (exerciseIsTimed) {
        exerciseDuration = (state.duration_seconds * effectiveSets) / 60;
      } else {
        exerciseDuration = (state.reps * 3 * effectiveSets) / 60;
      }

      // Calculate calories for completed sets
      const calories = calculateExerciseCalories(
        {
          type: ex.exerciseData?.type,
          met: ex.exerciseData?.met,
          volumeCoefficient: ex.exerciseData?.volume_coefficient,
        },
        {
          bodyWeightKg: profile?.body_weight_kg || 75,
          durationMinutes: exerciseDuration,
          weightKg: state.weight || 0,
          reps: state.reps || 0,
          sets: effectiveSets,
        }
      );

      totalCalories += calories.totalCalories;
      totalVolume += calories.volume || 0;
      totalDuration +=
        exerciseDuration +
        effectiveSets * ((ex.restSeconds || ex.rest_seconds || 60) / 60);
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalVolume: Math.round(totalVolume),
      totalDuration: Math.round(totalDuration),
    };
  };

  const liveStats = calculateLiveStats();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRadius: "24px",
          border: "2px solid #2a2a2a",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "2px solid #2a2a2a",
            background: isPaused
              ? "linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)"
              : "transparent",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                  letterSpacing: "0.05em",
                  color: "#fff",
                  marginBottom: "4px",
                }}
              >
                TODAY'S ROUTINE
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#4ECDC4",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {workout.routine.name}
              </p>
              <p style={{ fontSize: "12px", color: "#666" }}>
                {completedExercises} completed • {remainingExercises} remaining
                • {progress}% done
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={togglePause}
                style={{
                  background: isPaused
                    ? "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)"
                    : "#2a2a2a",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "20px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-icons">
                  {isPaused ? "play_arrow" : "pause"}
                </span>
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>

          {isPaused && (
            <div
              style={{
                background: "rgba(255, 107, 107, 0.1)",
                border: "1px solid #FF6B6B",
                borderRadius: "12px",
                padding: "12px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#FF6B6B",
                }}
              >
                <span className="material-icons">info</span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Paused at Set {currentSet} of{" "}
                  {currentExercise?.exerciseData?.name}
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginTop: "4px",
                  marginLeft: "32px",
                }}
              >
                Press play to resume or make adjustments below
              </p>
            </div>
          )}

          {/* Live Stats */}
          <div
            className="workout-live-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#FFD93D",
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {liveStats.totalCalories}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Calories
              </div>
            </div>
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#FF6B6B",
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {liveStats.totalVolume}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Volume kg
              </div>
            </div>
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#4ECDC4",
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                }}
              >
                {liveStats.totalDuration}m
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#666",
                  textTransform: "uppercase",
                }}
              >
                Duration
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: "0 24px", paddingTop: "16px" }}>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#2a2a2a",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
        </div>

        {/* Current Exercise */}
        <div style={{ padding: "24px" }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, #FF6B6B15 0%, #4ECDC415 100%)",
              border: "2px solid #FF6B6B30",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h4
              style={{
                fontSize: "28px",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
                color: "#fff",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              {currentExercise?.exerciseData?.name || "Exercise"}
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#666",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              {currentExercise?.exerciseData?.body_part} •{" "}
              {currentExercise?.exerciseData?.type}
            </p>

            <div
              className="workout-stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: isTimed ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                className="workout-stat-item"
                style={{ textAlign: "center" }}
              >
                <div
                  className="workout-stat-value"
                  style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "#FF6B6B",
                    fontFamily: "Bebas Neue, Impact, sans-serif",
                  }}
                >
                  {currentSet}/{currentExercise?.sets}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  Set
                </div>
              </div>
              {isTimed ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <button
                      onClick={() => adjustTime(-10)}
                      style={{
                        background: "#2a2a2a",
                        border: "none",
                        color: "#4ECDC4",
                        cursor: "pointer",
                        fontSize: "18px",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="material-icons"
                        style={{ fontSize: "18px" }}
                      >
                        remove
                      </span>
                    </button>
                    <div
                      style={{
                        fontSize: "48px",
                        fontWeight: 700,
                        color: "#4ECDC4",
                        fontFamily: "Bebas Neue, Impact, sans-serif",
                        minWidth: "120px",
                      }}
                    >
                      {currentState.duration_seconds}s
                    </div>
                    <button
                      onClick={() => adjustTime(10)}
                      style={{
                        background: "#2a2a2a",
                        border: "none",
                        color: "#4ECDC4",
                        cursor: "pointer",
                        fontSize: "18px",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="material-icons"
                        style={{ fontSize: "18px" }}
                      >
                        add
                      </span>
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Duration (±10s)
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <button
                        onClick={() => adjustReps(-1)}
                        style={{
                          background: "#2a2a2a",
                          border: "none",
                          color: "#4ECDC4",
                          cursor: "pointer",
                          fontSize: "18px",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          remove
                        </span>
                      </button>
                      <div
                        style={{
                          fontSize: "48px",
                          fontWeight: 700,
                          color: "#4ECDC4",
                          fontFamily: "Bebas Neue, Impact, sans-serif",
                          minWidth: "80px",
                        }}
                      >
                        {currentState.reps}
                      </div>
                      <button
                        onClick={() => adjustReps(1)}
                        style={{
                          background: "#2a2a2a",
                          border: "none",
                          color: "#4ECDC4",
                          cursor: "pointer",
                          fontSize: "18px",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          add
                        </span>
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        textTransform: "uppercase",
                      }}
                    >
                      Reps (±1)
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <button
                        onClick={() => adjustWeight(-2.5)}
                        style={{
                          background: "#2a2a2a",
                          border: "none",
                          color: "#FFD93D",
                          cursor: "pointer",
                          fontSize: "18px",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          remove
                        </span>
                      </button>
                      <div
                        style={{
                          fontSize: "48px",
                          fontWeight: 700,
                          color: "#FFD93D",
                          fontFamily: "Bebas Neue, Impact, sans-serif",
                          minWidth: "120px",
                        }}
                      >
                        {currentState.weight}kg
                      </div>
                      <button
                        onClick={() => adjustWeight(2.5)}
                        style={{
                          background: "#2a2a2a",
                          border: "none",
                          color: "#FFD93D",
                          cursor: "pointer",
                          fontSize: "18px",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          add
                        </span>
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        textTransform: "uppercase",
                      }}
                    >
                      Weight (±2.5kg)
                    </div>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "16px",
                background: "#0a0a0a",
                borderRadius: "12px",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "24px",
                  color: "#A8E6CF",
                  marginBottom: "8px",
                }}
              >
                timer
              </span>
              <div style={{ fontSize: "14px", color: "#A8E6CF" }}>
                Rest {currentExercise?.rest_seconds}s after this set
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Skip buttons row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <button
                onClick={handleSkipSet}
                style={{
                  padding: "12px",
                  background: "#2a2a2a",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  skip_next
                </span>
                Skip Set
              </button>
              <button
                onClick={handleSkipExercise}
                style={{
                  padding: "12px",
                  background: "#2a2a2a",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  fast_forward
                </span>
                Skip Exercise
              </button>
            </div>

            {/* Complete set button */}
            <button
              onClick={handleCompleteSet}
              disabled={isPaused}
              style={{
                padding: "18px",
                background: isPaused
                  ? "#444"
                  : "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: isPaused ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: isPaused
                  ? "none"
                  : "0 4px 20px rgba(78, 205, 196, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isPaused ? 0.5 : 1,
              }}
            >
              <span className="material-icons">check_circle</span>
              {currentSet === currentExercise?.sets &&
              currentExerciseIndex === totalExercises - 1
                ? "Finish Workout"
                : "Complete Set"}
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div
            style={{
              position: "fixed",
              bottom: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              background: showToast.includes("PR") ? "#111" : "#1a1a1a",
              border: showToast.includes("PR") ? "1px solid #D4AF3750" : "1px solid #2a2a2a",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 500,
              fontSize: "13px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              zIndex: 3000,
              animation: "fadeIn 0.3s ease-out",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {showToast.includes("PR") && (
              <span className="material-icons" style={{ color: "#D4AF37", fontSize: "18px" }}>emoji_events</span>
            )}
            <span style={{ color: showToast.includes("PR") ? "#D4AF37" : "#fff" }}>
              {showToast.replace("🏆 ", "")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Predefined Routines Modal
function PredefinedRoutinesModal({ exercises, onClose, onSelectRoutine }) {
  const [expandedRoutine, setExpandedRoutine] = useState(null);

  const predefinedRoutines = [
    {
      name: "FULL BODY",
      description: "Complete workout hitting all major muscle groups",
      icon: "fitness_center",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      glow: "rgba(102, 126, 234, 0.5)",
      exercises: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Dumbbell Bench Press", sets: 3, reps: 12, rest: 90 },
        { name: "Dumbbell Row", sets: 3, reps: 12, rest: 90 },
        { name: "Lat Pulldown (Wide Grip)", sets: 3, reps: 12, rest: 90 },
        { name: "Dumbbell Shoulder Press", sets: 3, reps: 12, rest: 90 },
        { name: "Back Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Lunges", sets: 3, reps: 12, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Russian Twist", sets: 3, reps: 20, rest: 90 },
        {
          name: "Farmer Carry",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
        { name: "Jump Rope", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
      ],
    },
    {
      name: "PUSH DAY",
      description: "Chest, shoulders & triceps focus",
      icon: "north",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      glow: "rgba(240, 147, 251, 0.5)",
      exercises: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Flat Barbell Bench Press", sets: 3, reps: 12, rest: 90 },
        { name: "Incline Barbell Bench Press", sets: 3, reps: 12, rest: 90 },
        { name: "Cable Fly (Mid)", sets: 3, reps: 15, rest: 90 },
        { name: "Dumbbell Fly", sets: 3, reps: 15, rest: 90 },
        { name: "Overhead Barbell Press", sets: 3, reps: 10, rest: 90 },
        { name: "Lateral Raises", sets: 3, reps: 15, rest: 90 },
        { name: "Arnold Press", sets: 3, reps: 10, rest: 90 },
        { name: "Tricep Pushdown", sets: 3, reps: 15, rest: 90 },
        { name: "Skull Crushers", sets: 3, reps: 12, rest: 90 },
        { name: "Dips", sets: 3, reps: 10, rest: 90 },
      ],
    },
    {
      name: "PULL DAY",
      description: "Back, biceps & rear delts",
      icon: "south",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      glow: "rgba(79, 172, 254, 0.5)",
      exercises: [
        { name: "Pull-ups", sets: 3, reps: 3, rest: 90 },
        { name: "Chin-ups", sets: 3, reps: 3, rest: 90 },
        { name: "Barbell Bent-Over Row", sets: 3, reps: 10, rest: 90 },
        { name: "Seated Cable Row", sets: 3, reps: 12, rest: 90 },
        { name: "Straight Arm Pulldown", sets: 3, reps: 15, rest: 90 },
        { name: "Barbell Curl", sets: 3, reps: 12, rest: 90 },
        { name: "Hammer Curl", sets: 3, reps: 12, rest: 90 },
        { name: "Rear Delt Fly", sets: 3, reps: 15, rest: 90 },
        { name: "Barbell Shrugs", sets: 3, reps: 12, rest: 90 },
        { name: "Dead Hang", sets: 3, reps: 0, rest: 90, duration_seconds: 40 },
      ],
    },
    {
      name: "LEG DAY",
      description: "Complete lower body workout",
      icon: "directions_run",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      glow: "rgba(250, 112, 154, 0.5)",
      exercises: [
        { name: "Back Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Leg Press", sets: 3, reps: 12, rest: 90 },
        { name: "Bulgarian Split Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Leg Extension", sets: 3, reps: 15, rest: 90 },
        { name: "Romanian Deadlift", sets: 3, reps: 10, rest: 90 },
        { name: "Leg Curl (Seated/Lying)", sets: 3, reps: 12, rest: 90 },
        { name: "Hip Thrust", sets: 3, reps: 12, rest: 90 },
        { name: "Step-ups", sets: 3, reps: 12, rest: 90 },
        { name: "Calf Raises", sets: 3, reps: 20, rest: 90 },
      ],
    },
    {
      name: "UPPER BODY",
      description: "Chest, back, shoulders & arms",
      icon: "accessibility_new",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      glow: "rgba(168, 237, 234, 0.5)",
      exercises: [
        { name: "Dumbbell Bench Press", sets: 3, reps: 12, rest: 90 },
        { name: "Incline Dumbbell Press", sets: 3, reps: 12, rest: 90 },
        { name: "Dumbbell Row", sets: 3, reps: 12, rest: 90 },
        { name: "Lat Pulldown (Close Grip)", sets: 3, reps: 12, rest: 90 },
        { name: "Lateral Raises", sets: 3, reps: 15, rest: 90 },
        { name: "Dumbbell Shoulder Press", sets: 3, reps: 12, rest: 90 },
        { name: "Barbell Curl", sets: 3, reps: 12, rest: 90 },
        { name: "Tricep Pushdown", sets: 3, reps: 15, rest: 90 },
      ],
    },
    {
      name: "LOWER BODY",
      description: "Quads, hamstrings, glutes & calves",
      icon: "skateboarding",
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      glow: "rgba(252, 182, 159, 0.5)",
      exercises: [
        { name: "Front Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Leg Press", sets: 3, reps: 12, rest: 90 },
        { name: "Step-ups", sets: 3, reps: 12, rest: 90 },
        { name: "Bulgarian Split Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Romanian Deadlift", sets: 3, reps: 10, rest: 90 },
        { name: "Leg Curl (Seated/Lying)", sets: 3, reps: 12, rest: 90 },
        { name: "Calf Raises", sets: 3, reps: 20, rest: 90 },
      ],
    },
    {
      name: "CORE FOCUS",
      description: "Abs, obliques & lower back",
      icon: "self_improvement",
      gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      glow: "rgba(255, 154, 158, 0.5)",
      exercises: [
        { name: "Crunch", sets: 3, reps: 20, rest: 90 },
        { name: "Leg Raise", sets: 3, reps: 12, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Russian Twist", sets: 3, reps: 20, rest: 90 },
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
        { name: "Hyperextensions", sets: 3, reps: 15, rest: 90 },
      ],
    },
    {
      name: "CARDIO BLAST",
      description: "Heart-pumping cardio circuits",
      icon: "favorite",
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      glow: "rgba(255, 236, 210, 0.5)",
      exercises: [
        { name: "Cycling", sets: 1, reps: 0, rest: 0, duration_seconds: 1500 },
        { name: "Running", sets: 1, reps: 0, rest: 0, duration_seconds: 1200 },
        {
          name: "Rowing Machine",
          sets: 1,
          reps: 0,
          rest: 0,
          duration_seconds: 900,
        },
        { name: "Burpees", sets: 3, reps: 15, rest: 90 },
        { name: "Jump Rope", sets: 3, reps: 0, rest: 90, duration_seconds: 90 },
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
      ],
    },
    {
      name: "CALISTHENICS",
      description: "Bodyweight training mastery",
      icon: "sports_gymnastics",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      glow: "rgba(48, 207, 208, 0.5)",
      exercises: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Incline Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Decline Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Pull-ups", sets: 3, reps: 3, rest: 90 },
        { name: "Chin-ups", sets: 3, reps: 3, rest: 90 },
        { name: "Inverted Row", sets: 3, reps: 12, rest: 90 },
        { name: "Lunges", sets: 3, reps: 15, rest: 90 },
        { name: "Step-ups", sets: 3, reps: 15, rest: 90 },
        { name: "Calf Raises", sets: 3, reps: 20, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Leg Raise", sets: 3, reps: 12, rest: 90 },
        { name: "Burpees", sets: 3, reps: 15, rest: 90 },
      ],
    },
    {
      name: "HOME STRENGTH",
      description: "No equipment needed",
      icon: "home",
      gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      glow: "rgba(161, 196, 253, 0.5)",
      exercises: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Incline Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Inverted Row", sets: 3, reps: 12, rest: 90 },
        { name: "Decline Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Lunges", sets: 3, reps: 15, rest: 90 },
        { name: "Step-ups", sets: 3, reps: 15, rest: 90 },
        { name: "Calf Raises", sets: 3, reps: 20, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Crunch", sets: 3, reps: 20, rest: 90 },
      ],
    },
    {
      name: "GYM STRENGTH",
      description: "Heavy compounds & accessories",
      icon: "sports_martial_arts",
      gradient: "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
      glow: "rgba(247, 112, 98, 0.5)",
      exercises: [
        { name: "Flat Barbell Bench Press", sets: 3, reps: 10, rest: 90 },
        { name: "Incline Dumbbell Press", sets: 3, reps: 10, rest: 90 },
        { name: "Barbell Bent-Over Row", sets: 3, reps: 10, rest: 90 },
        { name: "Seated Cable Row", sets: 3, reps: 12, rest: 90 },
        { name: "Overhead Barbell Press", sets: 3, reps: 10, rest: 90 },
        { name: "Back Squat", sets: 3, reps: 8, rest: 90 },
        { name: "Romanian Deadlift", sets: 3, reps: 10, rest: 90 },
        { name: "Barbell Curl", sets: 3, reps: 12, rest: 90 },
        { name: "Tricep Pushdown", sets: 3, reps: 15, rest: 90 },
      ],
    },
    {
      name: "MOBILITY & STRETCH",
      description: "Recovery & flexibility",
      icon: "spa",
      gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
      glow: "rgba(210, 153, 194, 0.5)",
      exercises: [
        { name: "Push-ups", sets: 2, reps: 10, rest: 60 },
        { name: "Lunges", sets: 2, reps: 12, rest: 60 },
        { name: "Inverted Row", sets: 2, reps: 10, rest: 60 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Hyperextensions", sets: 3, reps: 15, rest: 90 },
        { name: "Mountain Climbers", sets: 3, reps: 20, rest: 90 },
        { name: "Cycling", sets: 1, reps: 0, rest: 0, duration_seconds: 600 },
        { name: "Jump Rope", sets: 2, reps: 0, rest: 90, duration_seconds: 60 },
      ],
    },
    {
      name: "BEGINNER",
      description: "Perfect for starting your journey",
      icon: "emoji_events",
      gradient: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
      glow: "rgba(253, 219, 146, 0.5)",
      exercises: [
        { name: "Incline Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Lat Pulldown (Close Grip)", sets: 3, reps: 12, rest: 90 },
        { name: "Lateral Raises", sets: 3, reps: 15, rest: 90 },
        { name: "Step-ups", sets: 3, reps: 12, rest: 90 },
        { name: "Crunch", sets: 3, reps: 20, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Jump Rope", sets: 2, reps: 0, rest: 90, duration_seconds: 60 },
      ],
    },
    {
      name: "INTERMEDIATE",
      description: "Level up your training",
      icon: "workspace_premium",
      gradient: "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
      glow: "rgba(150, 251, 196, 0.5)",
      exercises: [
        { name: "Dumbbell Bench Press", sets: 3, reps: 12, rest: 90 },
        { name: "Dumbbell Row", sets: 3, reps: 12, rest: 90 },
        { name: "Dumbbell Shoulder Press", sets: 3, reps: 12, rest: 90 },
        { name: "Leg Press", sets: 3, reps: 12, rest: 90 },
        { name: "Lunges", sets: 3, reps: 15, rest: 90 },
        { name: "Russian Twist", sets: 3, reps: 20, rest: 90 },
        { name: "Leg Raise", sets: 3, reps: 12, rest: 90 },
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
      ],
    },
    {
      name: "ADVANCED",
      description: "Maximum intensity training",
      icon: "military_tech",
      gradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
      glow: "rgba(224, 195, 252, 0.5)",
      exercises: [
        { name: "Decline Dumbbell Press", sets: 3, reps: 10, rest: 90 },
        { name: "Chest Dips", sets: 3, reps: 10, rest: 90 },
        { name: "Pendlay Row", sets: 3, reps: 10, rest: 90 },
        { name: "Pull-ups", sets: 3, reps: 3, rest: 90 },
        { name: "Arnold Press", sets: 3, reps: 10, rest: 90 },
        { name: "Rear Delt Fly", sets: 3, reps: 15, rest: 90 },
        { name: "Bulgarian Split Squat", sets: 3, reps: 10, rest: 90 },
        { name: "Romanian Deadlift", sets: 3, reps: 10, rest: 90 },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
        { name: "Burpees", sets: 3, reps: 15, rest: 90 },
      ],
    },
    {
      name: "HIIT CONDITIONING",
      description: "High-intensity interval training",
      icon: "local_fire_department",
      gradient: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
      glow: "rgba(251, 194, 235, 0.5)",
      exercises: [
        { name: "Burpees", sets: 3, reps: 15, rest: 90 },
        { name: "Jump Rope", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
        { name: "Push-ups", sets: 3, reps: 10, rest: 90 },
        { name: "Lunges", sets: 3, reps: 15, rest: 90 },
        {
          name: "Mountain Climbers",
          sets: 3,
          reps: 0,
          rest: 90,
          duration_seconds: 30,
        },
        { name: "Plank", sets: 3, reps: 0, rest: 90, duration_seconds: 60 },
      ],
    },
  ];

  const handleSelectRoutine = (routine) => {
    // Map exercise names to exercise IDs
    const mappedExercises = routine.exercises
      .map((ex) => {
        const exerciseData = exercises.find((e) => e.name === ex.name);
        return {
          exercise_id: exerciseData?.id || "",
          exerciseData: exerciseData,
          sets: ex.sets,
          reps: ex.reps,
          weight: 0,
          rest_seconds: ex.rest,
          duration_seconds: ex.duration_seconds || 0,
        };
      })
      .filter((ex) => ex.exercise_id); // Only include exercises that were found

    const routineData = {
      name: routine.name,
      exercises: mappedExercises,
    };

    onSelectRoutine(routineData);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "Bebas Neue, Impact, sans-serif",
                  fontSize: "42px",
                  letterSpacing: "0.05em",
                  color: "#fff",
                  margin: 0,
                }}
              >
                PREDEFINED ROUTINES
              </h2>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  margin: "8px 0 0 0",
                  fontSize: "16px",
                }}
              >
                Choose a professionally designed workout program
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="material-icons" style={{ fontSize: "28px" }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* Routines Grid */}
        <div
          className="modal-content-padding"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
          }}
        >
          <div
            className="predefined-routines-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {predefinedRoutines.map((routine, index) => {
              const isExpanded = expandedRoutine === index;
              return (
                <div
                  key={index}
                  className="predefined-routine-card"
                  style={{
                    background: isExpanded ? "#2a2a2a" : "#242424",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: `2px solid ${
                      isExpanded
                        ? routine.gradient.match(/#[0-9A-F]{6}/i)?.[0]
                        : "rgba(255, 255, 255, 0.05)"
                    }`,
                    transition: "all 0.3s ease",
                    boxShadow: isExpanded
                      ? `0 12px 40px ${routine.glow}`
                      : "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {/* Header with Gradient */}
                  <div
                    style={{
                      background: routine.gradient,
                      padding: "24px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(10px)",
                      }}
                    ></div>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "32px", color: "#fff" }}
                        >
                          {routine.icon}
                        </span>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "22px",
                            fontWeight: 800,
                            color: "#fff",
                            letterSpacing: "0.5px",
                            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {routine.name}
                        </h3>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "rgba(255, 255, 255, 0.9)",
                          fontWeight: 500,
                        }}
                      >
                        {routine.description}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "20px" }}>
                    {/* Stats */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "16px",
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#999",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{
                            fontSize: "18px",
                            color: routine.gradient.match(/#[0-9A-F]{6}/i)?.[0],
                          }}
                        >
                          fitness_center
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>
                          {routine.exercises.length} exercises
                        </span>
                      </div>
                    </div>

                    {/* Expandable Exercise List */}
                    <div
                      style={{
                        maxHeight: isExpanded ? "400px" : "0",
                        overflow: isExpanded ? "auto" : "hidden",
                        transition: "max-height 0.3s ease",
                        marginBottom: isExpanded ? "16px" : "0",
                      }}
                    >
                      {routine.exercises.map((ex, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 12px",
                            background:
                              i % 2 === 0
                                ? "rgba(255, 255, 255, 0.03)"
                                : "transparent",
                            borderRadius: "8px",
                            marginBottom: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#ccc",
                              fontWeight: 500,
                            }}
                          >
                            {ex.name}
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              fontWeight: 600,
                            }}
                          >
                            {ex.duration_seconds
                              ? `${ex.sets}×${ex.duration_seconds}s`
                              : `${ex.sets}×${ex.reps}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRoutine(isExpanded ? null : index);
                        }}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.05)";
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                        {isExpanded ? "Hide" : "View All"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRoutine(routine);
                        }}
                        style={{
                          flex: 2,
                          padding: "12px",
                          background: routine.gradient,
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          boxShadow: `0 4px 15px ${routine.glow}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = `0 6px 20px ${routine.glow}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = `0 4px 15px ${routine.glow}`;
                        }}
                      >
                        <span className="material-icons">add_circle</span>
                        Add Routine
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
