import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getExercises, createActiveProgram } from "../lib/firebase-database";

const CustomAutoRoutineBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numDays, setNumDays] = useState(null);
  const [programName, setProgramName] = useState("");
  const [dayRoutines, setDayRoutines] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    if (!user) return;
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
      showToast("Error loading exercises", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDays = (days) => {
    setNumDays(days);
    const routines = [];
    for (let i = 0; i < days; i++) {
      routines.push({
        name: `Day ${i + 1}`,
        customName: "", // Optional custom day name
        exercises: [],
        muscleGroups: [],
      });
    }
    setDayRoutines(routines);
    setSelectedDay(0);
  };

  const updateDayName = (dayIndex, customName) => {
    const updated = [...dayRoutines];
    updated[dayIndex].customName = customName;
    // Update the displayed name to use custom name if provided
    updated[dayIndex].name = customName.trim() || `Day ${dayIndex + 1}`;
    setDayRoutines(updated);
  };

  const addExerciseToDay = (exercise) => {
    console.log("=== ADDING EXERCISE ===");
    console.log("Full exercise object:", exercise);
    console.log("Exercise ID:", exercise.id);
    console.log("Exercise name:", exercise.name);
    console.log("Exercise muscleGroup:", exercise.muscleGroup);
    console.log("Exercise category:", exercise.category);

    const updatedRoutines = [...dayRoutines];
    const newExercise = {
      exerciseId: exercise.id || exercise.name,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || exercise.category,
      category: exercise.category,
      sets: 3,
      reps: 12,
      restSeconds: 60,
      weight: 0,
      notes: "",
    };

    console.log("=== NEW EXERCISE CREATED ===");
    console.log("New exercise object:", JSON.stringify(newExercise, null, 2));
    updatedRoutines[selectedDay].exercises.push(newExercise);

    // Update muscle groups
    const muscleGroupToAdd = exercise.muscleGroup || exercise.category || "";
    if (
      muscleGroupToAdd &&
      !updatedRoutines[selectedDay].muscleGroups.includes(muscleGroupToAdd)
    ) {
      updatedRoutines[selectedDay].muscleGroups.push(muscleGroupToAdd);
    }

    setDayRoutines(updatedRoutines);
    console.log("=== DAY ROUTINES UPDATED ===");
    console.log("Updated routines:", JSON.stringify(updatedRoutines, null, 2));
    showToast(`${exercise.name} added to Day ${selectedDay + 1}`, "success");
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    const updatedRoutines = [...dayRoutines];
    updatedRoutines[dayIndex].exercises.splice(exerciseIndex, 1);

    // Recalculate muscle groups
    const muscleGroups = [
      ...new Set(
        updatedRoutines[dayIndex].exercises
          .map((e) => e.muscleGroup || "")
          .filter(Boolean)
      ),
    ];
    updatedRoutines[dayIndex].muscleGroups = muscleGroups;

    setDayRoutines(updatedRoutines);
  };

  const updateExerciseInDay = (dayIndex, exerciseIndex, field, value) => {
    const updatedRoutines = [...dayRoutines];
    updatedRoutines[dayIndex].exercises[exerciseIndex][field] = value;
    setDayRoutines(updatedRoutines);
  };

  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      showToast("Please enter a program name", "error");
      return;
    }

    const emptyDays = dayRoutines.filter((day) => day.exercises.length === 0);
    if (emptyDays.length > 0) {
      showToast("All days must have at least one exercise", "error");
      return;
    }

    try {
      setLoading(true);

      // Clean the routines data to ensure no undefined values
      const cleanedRoutines = dayRoutines.map((day, dayIdx) => {
        const cleanedExercises = day.exercises.map((ex, exIdx) => {
          // Log any undefined values for debugging
          if (!ex.exerciseId && !ex.name) {
            console.error(
              `Day ${dayIdx + 1}, Exercise ${exIdx + 1} has no ID or name`,
              ex
            );
          }

          return {
            exerciseId:
              ex.exerciseId || ex.name || `exercise_${dayIdx}_${exIdx}`,
            name: ex.name || "Unknown Exercise",
            muscleGroup: ex.muscleGroup || "Unknown",
            sets: Number(ex.sets) || 3,
            reps: Number(ex.reps) || 12,
            restSeconds: Number(ex.restSeconds) || 60,
            weight: Number(ex.weight) || 0,
            notes: String(ex.notes || ""),
            exerciseData: {
              id: ex.exerciseId || ex.name,
              name: ex.name || "Unknown Exercise",
              muscleGroup: ex.muscleGroup || "Unknown",
              category: ex.category || ex.muscleGroup || "Unknown",
              body_part: ex.muscleGroup || "Unknown",
              type: ex.category === "cardio" ? "cardio" : "strength",
              met: 8.0,
              volume_coefficient: 1.0,
            },
          };
        });

        return {
          name: String(day.name || `Day ${dayIdx + 1}`),
          exercises: cleanedExercises,
          muscleGroups: (day.muscleGroups || []).filter(Boolean),
        };
      });

      console.log("Cleaned routines:", cleanedRoutines);

      await createActiveProgram(user.uid, {
        programName: programName.trim(),
        goal: "Custom",
        totalDays: numDays,
        allRoutines: cleanedRoutines,
      });

      showToast("Custom program created! Start your Day 1 workout.", "success");
      navigate("/routines");
    } catch (error) {
      console.error("Error creating program:", error);
      showToast("Error creating program. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || ex.muscleGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique muscle groups from exercises
  const muscleGroups = [
    "all",
    ...new Set(exercises.map((ex) => ex.muscleGroup).filter(Boolean)),
  ];
  const categoryLabels = {
    all: "All Exercises",
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    arms: "Arms",
    legs: "Legs",
    core: "Core",
    cardio: "Cardio",
    flexibility: "Flexibility",
  };

  if (loading && exercises.length === 0) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <div
          className="material-icons"
          style={{
            fontSize: "48px",
            color: "#4ECDC4",
            animation: "spin 1s linear infinite",
          }}
        >
          refresh
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "48px", animation: "fadeIn 0.5s ease-out" }}>
        <button
          onClick={() => navigate("/routines")}
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
          Back to Routines
        </button>

        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "64px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CUSTOM AUTO ROUTINE
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "16px",
            fontWeight: 500,
            maxWidth: "800px",
          }}
        >
          Create your own routine and follow it day by day. Start at Day 1 →
          complete it to unlock Day 2 → restart after finishing all days.
        </p>
      </div>

      {/* Step 1: Select Number of Days */}
      {numDays === null && (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "24px",
              color: "#fff",
              fontFamily: "Bebas Neue",
              letterSpacing: "0.05em",
            }}
          >
            How many days in your routine?
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {[2, 3, 4, 5, 6].map((days) => (
              <div
                key={days}
                onClick={() => handleSelectDays(days)}
                style={{
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "16px",
                  padding: "32px 24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4ECDC4";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 40px rgba(78, 205, 196, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "#4ECDC4",
                    fontFamily: "Bebas Neue",
                    marginBottom: "8px",
                  }}
                >
                  {days}
                </div>
                <div
                  style={{ fontSize: "14px", color: "#999", fontWeight: 600 }}
                >
                  DAY SPLIT
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Build Routine */}
      {numDays !== null && (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
          {/* Program Name Input */}
          <div
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                color: "#999",
                marginBottom: "8px",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              PROGRAM NAME
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., My Push Pull Legs Routine"
              style={{
                width: "100%",
                padding: "16px",
                background: "#121212",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr",
              gap: "24px",
            }}
          >
            {/* Day Selector */}
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  color: "#fff",
                  fontFamily: "Bebas Neue",
                  letterSpacing: "0.05em",
                }}
              >
                SELECT DAY
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {dayRoutines.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    style={{
                      background:
                        selectedDay === index ? "#4ECDC420" : "#0a0a0a",
                      border: `2px solid ${
                        selectedDay === index ? "#4ECDC4" : "#2a2a2a"
                      }`,
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: "4px",
                      }}
                    >
                      {day.customName || `Day ${index + 1}`}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {day.exercises.length} exercise
                      {day.exercises.length !== 1 ? "s" : ""}
                    </div>
                    {day.exercises.length > 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#4ECDC4",
                          marginTop: "8px",
                          fontFamily: "Roboto Mono",
                        }}
                      >
                        {day.muscleGroups.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setNumDays(null);
                  setDayRoutines([]);
                  setSelectedDay(null);
                  setProgramName("");
                }}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px",
                  background: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "12px",
                  color: "#999",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: "16px",
                    verticalAlign: "middle",
                    marginRight: "8px",
                  }}
                >
                  restart_alt
                </span>
                Start Over
              </button>
            </div>

            {/* Exercise Builder */}
            <div>
              {selectedDay !== null && (
                <>
                  {/* Current Day Exercises */}
                  <div
                    style={{
                      background: "#0a0a0a",
                      border: "2px solid #2a2a2a",
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    {/* Day Name Input (Optional) */}
                    <div style={{ marginBottom: "20px" }}>
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
                        Day Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={dayRoutines[selectedDay].customName || ""}
                        onChange={(e) => updateDayName(selectedDay, e.target.value)}
                        placeholder={`Day ${selectedDay + 1} (e.g., "Chest Day", "Leg Day")`}
                        style={{
                          width: "100%",
                          background: "#121212",
                          border: "2px solid #2a2a2a",
                          borderRadius: "8px",
                          padding: "12px 16px",
                          color: "#fff",
                          fontSize: "14px",
                          fontFamily: "inherit",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#4ECDC4";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#2a2a2a";
                        }}
                      />
                    </div>

                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: "#fff",
                        fontFamily: "Bebas Neue",
                        letterSpacing: "0.05em",
                      }}
                    >
                      EXERCISES
                    </h3>

                    {dayRoutines[selectedDay].exercises.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 24px",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{
                            fontSize: "48px",
                            marginBottom: "16px",
                            opacity: 0.3,
                          }}
                        >
                          fitness_center
                        </span>
                        <div>
                          No exercises added yet. Add exercises from below.
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {dayRoutines[selectedDay].exercises.map(
                          (exercise, exIdx) => (
                            <div
                              key={exIdx}
                              style={{
                                background: "#121212",
                                border: "2px solid #2a2a2a",
                                borderRadius: "12px",
                                padding: "16px",
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
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 700,
                                      color: "#fff",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    {exIdx + 1}. {exercise.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#4ECDC4",
                                      fontFamily: "Roboto Mono",
                                    }}
                                  >
                                    {exercise.muscleGroup}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    removeExerciseFromDay(selectedDay, exIdx)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ff6b6b",
                                    cursor: "pointer",
                                    padding: "4px",
                                  }}
                                >
                                  <span
                                    className="material-icons"
                                    style={{ fontSize: "20px" }}
                                  >
                                    delete
                                  </span>
                                </button>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr 1fr",
                                  gap: "12px",
                                }}
                              >
                                <div>
                                  <label
                                    style={{
                                      fontSize: "11px",
                                      color: "#666",
                                      fontWeight: 600,
                                      display: "block",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    SETS
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={exercise.sets}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d*$/.test(val)) {
                                        updateExerciseInDay(
                                          selectedDay,
                                          exIdx,
                                          "sets",
                                          parseInt(val) || 1
                                        );
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "8px",
                                      background: "#0a0a0a",
                                      border: "2px solid #2a2a2a",
                                      borderRadius: "8px",
                                      color: "#fff",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    style={{
                                      fontSize: "11px",
                                      color: "#666",
                                      fontWeight: 600,
                                      display: "block",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    REPS
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={exercise.reps}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d*$/.test(val)) {
                                        updateExerciseInDay(
                                          selectedDay,
                                          exIdx,
                                          "reps",
                                          parseInt(val) || 1
                                        );
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "8px",
                                      background: "#0a0a0a",
                                      border: "2px solid #2a2a2a",
                                      borderRadius: "8px",
                                      color: "#fff",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    style={{
                                      fontSize: "11px",
                                      color: "#666",
                                      fontWeight: 600,
                                      display: "block",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    REST (s)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={exercise.restSeconds}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d*$/.test(val)) {
                                        updateExerciseInDay(
                                          selectedDay,
                                          exIdx,
                                          "restSeconds",
                                          parseInt(val) || 30
                                        );
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "8px",
                                      background: "#0a0a0a",
                                      border: "2px solid #2a2a2a",
                                      borderRadius: "8px",
                                      color: "#fff",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exercise Library */}
                  <div
                    style={{
                      background: "#0a0a0a",
                      border: "2px solid #2a2a2a",
                      borderRadius: "16px",
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: "#fff",
                        fontFamily: "Bebas Neue",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ADD EXERCISES
                    </h3>

                    {/* Category Filter */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      {muscleGroups.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          style={{
                            padding: "8px 16px",
                            background:
                              selectedCategory === cat ? "#4ECDC4" : "#121212",
                            border: `2px solid ${
                              selectedCategory === cat ? "#4ECDC4" : "#2a2a2a"
                            }`,
                            borderRadius: "8px",
                            color: selectedCategory === cat ? "#000" : "#999",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {categoryLabels[cat] ||
                            cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search exercises..."
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "#121212",
                        border: "2px solid #2a2a2a",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "14px",
                        marginBottom: "16px",
                        outline: "none",
                      }}
                    />

                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {filteredExercises.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "24px",
                            color: "#666",
                          }}
                        >
                          No exercises found
                        </div>
                      ) : (
                        filteredExercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            onClick={() => addExerciseToDay(exercise)}
                            style={{
                              background: "#121212",
                              border: "2px solid #2a2a2a",
                              borderRadius: "12px",
                              padding: "12px 16px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#4ECDC4";
                              e.currentTarget.style.background = "#4ECDC410";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#2a2a2a";
                              e.currentTarget.style.background = "#121212";
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#fff",
                                  marginBottom: "2px",
                                }}
                              >
                                {exercise.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#4ECDC4",
                                  fontFamily: "Roboto Mono",
                                }}
                              >
                                {exercise.muscleGroup}
                              </div>
                            </div>
                            <span
                              className="material-icons"
                              style={{ color: "#4ECDC4", fontSize: "20px" }}
                            >
                              add_circle_outline
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div
            style={{
              position: "sticky",
              bottom: "24px",
              marginTop: "32px",
              display: "flex",
              gap: "16px",
            }}
          >
            <button
              onClick={handleSaveProgram}
              disabled={loading || !programName.trim()}
              style={{
                flex: 1,
                padding: "20px",
                background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                border: "none",
                borderRadius: "16px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 700,
                cursor:
                  loading || !programName.trim() ? "not-allowed" : "pointer",
                opacity: loading || !programName.trim() ? 0.5 : 1,
                boxShadow: "0 8px 32px rgba(78, 205, 196, 0.4)",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "24px",
                  marginRight: "12px",
                  verticalAlign: "middle",
                }}
              >
                check_circle
              </span>
              START CUSTOM PROGRAM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomAutoRoutineBuilder;
