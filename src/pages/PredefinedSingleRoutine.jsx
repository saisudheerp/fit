import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { createRoutine } from "../lib/firebase-database";

const PredefinedSingleRoutine = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const predefinedRoutines = [
    {
      name: "Full Body Blast",
      description:
        "Complete full body workout targeting all major muscle groups",
      exercises: [
        {
          name: "Barbell Squat",
          muscleGroup: "legs",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Barbell Row",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Overhead Press",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Deadlift",
          muscleGroup: "legs",
          sets: 3,
          reps: 8,
          restSeconds: 120,
        },
        {
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 3,
          reps: 10,
          restSeconds: 60,
        },
      ],
      icon: "fitness_center",
      color: "#667eea",
    },
    {
      name: "Push Day",
      description: "Chest, shoulders, and triceps workout",
      exercises: [
        {
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Incline Dumbbell Press",
          muscleGroup: "chest",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Overhead Press",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Lateral Raises",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Tricep Dips",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Cable Tricep Pushdown",
          muscleGroup: "arms",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
      ],
      icon: "front_hand",
      color: "#f093fb",
    },
    {
      name: "Pull Day",
      description: "Back, biceps, and rear delts workout",
      exercises: [
        {
          name: "Deadlift",
          muscleGroup: "back",
          sets: 4,
          reps: 8,
          restSeconds: 120,
        },
        {
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Barbell Row",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Face Pulls",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Barbell Curl",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Hammer Curls",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
      ],
      icon: "back_hand",
      color: "#4ECDC4",
    },
    {
      name: "Leg Day",
      description: "Complete lower body workout",
      exercises: [
        {
          name: "Barbell Squat",
          muscleGroup: "legs",
          sets: 4,
          reps: 10,
          restSeconds: 120,
        },
        {
          name: "Romanian Deadlift",
          muscleGroup: "legs",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Leg Press",
          muscleGroup: "legs",
          sets: 3,
          reps: 12,
          restSeconds: 90,
        },
        {
          name: "Leg Curl",
          muscleGroup: "legs",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Calf Raises",
          muscleGroup: "legs",
          sets: 4,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Lunges",
          muscleGroup: "legs",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
      ],
      icon: "directions_run",
      color: "#FFD93D",
    },
    {
      name: "Chest & Triceps",
      description: "Focused chest and tricep development",
      exercises: [
        {
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Incline Dumbbell Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 12,
          restSeconds: 75,
        },
        {
          name: "Cable Flyes",
          muscleGroup: "chest",
          sets: 3,
          reps: 15,
          restSeconds: 60,
        },
        {
          name: "Close-Grip Bench Press",
          muscleGroup: "arms",
          sets: 4,
          reps: 10,
          restSeconds: 75,
        },
        {
          name: "Tricep Dips",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Overhead Tricep Extension",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
      ],
      icon: "favorite",
      color: "#ff6b6b",
    },
    {
      name: "Back & Biceps",
      description: "Back width and thickness with bicep work",
      exercises: [
        {
          name: "Deadlift",
          muscleGroup: "back",
          sets: 4,
          reps: 8,
          restSeconds: 120,
        },
        {
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Barbell Row",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Lat Pulldown",
          muscleGroup: "back",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Barbell Curl",
          muscleGroup: "arms",
          sets: 4,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Hammer Curls",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
      ],
      icon: "self_improvement",
      color: "#44A08D",
    },
    {
      name: "Shoulder Day",
      description: "Complete shoulder development - all three heads",
      exercises: [
        {
          name: "Overhead Press",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Dumbbell Lateral Raises",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Rear Delt Flyes",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Arnold Press",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Face Pulls",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 20,
          restSeconds: 45,
        },
        {
          name: "Dumbbell Shrugs",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 15,
          restSeconds: 60,
        },
      ],
      icon: "sports_gymnastics",
      color: "#FFA500",
    },
    {
      name: "Upper Body",
      description: "Complete upper body strength workout",
      exercises: [
        {
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Barbell Row",
          muscleGroup: "back",
          sets: 4,
          reps: 10,
          restSeconds: 90,
        },
        {
          name: "Overhead Press",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 12,
          restSeconds: 75,
        },
        {
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 3,
          reps: 10,
          restSeconds: 75,
        },
        {
          name: "Barbell Curl",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Tricep Dips",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 60,
        },
      ],
      icon: "accessibility_new",
      color: "#9B59B6",
    },
    {
      name: "Core & Abs Blast",
      description: "Intense core workout for six-pack development",
      exercises: [
        {
          name: "Plank",
          muscleGroup: "core",
          sets: 4,
          reps: 60,
          restSeconds: 45,
        },
        {
          name: "Russian Twists",
          muscleGroup: "core",
          sets: 4,
          reps: 20,
          restSeconds: 45,
        },
        {
          name: "Bicycle Crunches",
          muscleGroup: "core",
          sets: 4,
          reps: 30,
          restSeconds: 30,
        },
        {
          name: "Leg Raises",
          muscleGroup: "core",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Mountain Climbers",
          muscleGroup: "core",
          sets: 4,
          reps: 30,
          restSeconds: 30,
        },
        {
          name: "Dead Bug",
          muscleGroup: "core",
          sets: 3,
          reps: 20,
          restSeconds: 45,
        },
      ],
      icon: "fitbit",
      color: "#FF6B9D",
    },
    {
      name: "Cardio HIIT",
      description: "High intensity interval training for fat burning",
      exercises: [
        {
          name: "Burpees",
          muscleGroup: "cardio",
          sets: 5,
          reps: 15,
          restSeconds: 30,
        },
        {
          name: "Jump Squats",
          muscleGroup: "cardio",
          sets: 5,
          reps: 20,
          restSeconds: 30,
        },
        {
          name: "Mountain Climbers",
          muscleGroup: "cardio",
          sets: 5,
          reps: 30,
          restSeconds: 30,
        },
        {
          name: "High Knees",
          muscleGroup: "cardio",
          sets: 5,
          reps: 40,
          restSeconds: 30,
        },
        {
          name: "Jump Lunges",
          muscleGroup: "cardio",
          sets: 4,
          reps: 20,
          restSeconds: 30,
        },
        {
          name: "Box Jumps",
          muscleGroup: "cardio",
          sets: 4,
          reps: 15,
          restSeconds: 45,
        },
      ],
      icon: "flash_on",
      color: "#FF4757",
    },
    {
      name: "Arms Builder",
      description: "Dedicated biceps and triceps workout",
      exercises: [
        {
          name: "Barbell Curl",
          muscleGroup: "arms",
          sets: 4,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Tricep Dips",
          muscleGroup: "arms",
          sets: 4,
          reps: 12,
          restSeconds: 60,
        },
        {
          name: "Hammer Curls",
          muscleGroup: "arms",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Overhead Tricep Extension",
          muscleGroup: "arms",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
        {
          name: "Concentration Curls",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
          restSeconds: 45,
        },
        {
          name: "Cable Tricep Pushdown",
          muscleGroup: "arms",
          sets: 3,
          reps: 15,
          restSeconds: 45,
        },
      ],
      icon: "sports_martial_arts",
      color: "#3742FA",
    },
    {
      name: "Power & Strength",
      description: "Heavy compound lifts for maximum strength",
      exercises: [
        {
          name: "Deadlift",
          muscleGroup: "back",
          sets: 5,
          reps: 5,
          restSeconds: 180,
        },
        {
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 5,
          reps: 5,
          restSeconds: 180,
        },
        {
          name: "Barbell Squat",
          muscleGroup: "legs",
          sets: 5,
          reps: 5,
          restSeconds: 180,
        },
        {
          name: "Overhead Press",
          muscleGroup: "shoulders",
          sets: 4,
          reps: 6,
          restSeconds: 120,
        },
        {
          name: "Barbell Row",
          muscleGroup: "back",
          sets: 4,
          reps: 6,
          restSeconds: 120,
        },
      ],
      icon: "military_tech",
      color: "#2C3A47",
    },
  ];

  const handleSelectRoutine = async (routine) => {
    try {
      setLoading(true);

      // Add exercise IDs and exerciseData wrapper
      const exercisesWithIds = routine.exercises.map((ex) => ({
        ...ex,
        exerciseId: ex.name,
        category: ex.muscleGroup,
        weight: 0,
        notes: "",
        exerciseData: {
          id: ex.name,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          category: ex.muscleGroup,
          body_part: ex.muscleGroup,
          type: ex.muscleGroup === "cardio" ? "cardio" : "strength",
          met: 8.0,
          volume_coefficient: 1.0,
        },
      }));

      await createRoutine(user.uid, {
        name: routine.name,
        exercises: exercisesWithIds,
        isSingleDay: true,
      });

      showToast(`${routine.name} routine created!`, "success");
      navigate("/routines");
    } catch (error) {
      console.error("Error creating routine:", error);
      showToast("Error creating routine. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <button
          onClick={() => navigate("/create-routine")}
          style={{
            background: "none",
            border: "none",
            color: "#4ECDC4",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>
            arrow_back
          </span>
          Back
        </button>

        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "64px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          PREDEFINED ROUTINES
        </h2>
        <p style={{ color: "#999", fontSize: "16px", fontWeight: 500 }}>
          Choose a ready-made single-day workout routine
        </p>
      </div>

      {/* Routine Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "24px",
        }}
      >
        {predefinedRoutines.map((routine, index) => (
          <div
            key={index}
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "24px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={() => handleSelectRoutine(routine)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = routine.color;
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 40px ${routine.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: `${routine.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: "32px", color: routine.color }}
                >
                  {routine.icon}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {routine.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {routine.exercises.length} exercises
                </div>
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                color: "#999",
                fontSize: "14px",
                marginBottom: "16px",
                lineHeight: "1.6",
              }}
            >
              {routine.description}
            </p>

            {/* Exercise List */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {routine.exercises.slice(0, 4).map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#121212",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {ex.name}
                  </span>
                  <span
                    style={{
                      color: routine.color,
                      fontWeight: 600,
                      fontFamily: "Roboto Mono",
                    }}
                  >
                    {ex.sets} × {ex.reps}
                  </span>
                </div>
              ))}
              {routine.exercises.length > 4 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#666",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  +{routine.exercises.length - 4} more exercises
                </div>
              )}
            </div>

            {/* Select Button */}
            <button
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "12px",
                background: `linear-gradient(135deg, ${routine.color} 0%, ${routine.color}DD 100%)`,
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              SELECT ROUTINE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredefinedSingleRoutine;
