import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getExercises, createRoutine } from "../lib/firebase-database";

const CustomSingleRoutine = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
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

  const addExercise = (exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        sets: 3,
        reps: 12,
        restSeconds: 60,
        weight: 0,
        notes: "",
        exerciseData: {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          category: exercise.category,
          body_part: exercise.muscleGroup,
          type: exercise.category === "cardio" ? "cardio" : "strength",
          met: 8.0,
          volume_coefficient: 1.0,
        },
      },
    ]);
    showToast(`${exercise.name} added`, "success");
  };

  const removeExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index][field] = value;
    setSelectedExercises(updated);
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      showToast("Please enter a routine name", "error");
      return;
    }

    if (selectedExercises.length === 0) {
      showToast("Please add at least one exercise", "error");
      return;
    }

    try {
      setLoading(true);
      await createRoutine(user.uid, {
        name: routineName.trim(),
        exercises: selectedExercises,
        isSingleDay: true,
      });

      showToast("Single-day routine created!", "success");
      navigate("/routines");
    } catch (error) {
      console.error("Error creating routine:", error);
      showToast("Error creating routine. Please try again.", "error");
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

  const muscleGroups = [
    "all",
    ...new Set(exercises.map((ex) => ex.muscleGroup).filter(Boolean)),
  ];
  const categoryLabels = {
    all: "All",
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    arms: "Arms",
    legs: "Legs",
    core: "Core",
    cardio: "Cardio",
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CUSTOM SINGLE ROUTINE
        </h2>
        <p style={{ color: "#999", fontSize: "16px", fontWeight: 500 }}>
          Create your own 1-day workout. Always perform the same routine.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "24px",
        }}
      >
        {/* Exercise Library */}
        <div>
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
              EXERCISE LIBRARY
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
                      selectedCategory === cat ? "#667eea" : "#121212",
                    border: `2px solid ${
                      selectedCategory === cat ? "#667eea" : "#2a2a2a"
                    }`,
                    borderRadius: "8px",
                    color: selectedCategory === cat ? "#fff" : "#999",
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
                maxHeight: "600px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => addExercise(exercise)}
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
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.background = "#667eea10";
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
                        color: "#667eea",
                        fontFamily: "Roboto Mono",
                      }}
                    >
                      {exercise.muscleGroup}
                    </div>
                  </div>
                  <span
                    className="material-icons"
                    style={{ color: "#667eea", fontSize: "20px" }}
                  >
                    add_circle_outline
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Exercises */}
        <div>
          <div
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "24px",
              position: "sticky",
              top: "24px",
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
              YOUR ROUTINE
            </h3>

            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Routine Name (e.g., Full Body Blast)"
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
              style={{ marginBottom: "16px", color: "#999", fontSize: "12px" }}
            >
              {selectedExercises.length} exercise
              {selectedExercises.length !== 1 ? "s" : ""}
            </div>

            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {selectedExercises.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#666",
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
                  <div>Add exercises from the library</div>
                </div>
              ) : (
                selectedExercises.map((exercise, index) => (
                  <div
                    key={index}
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
                          {index + 1}. {exercise.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#667eea",
                            fontFamily: "Roboto Mono",
                          }}
                        >
                          {exercise.muscleGroup}
                        </div>
                      </div>
                      <button
                        onClick={() => removeExercise(index)}
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
                        gap: "8px",
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
                              updateExercise(
                                index,
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
                              updateExercise(
                                index,
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
                              updateExercise(
                                index,
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
                ))
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={
                loading || !routineName.trim() || selectedExercises.length === 0
              }
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor:
                  loading ||
                  !routineName.trim() ||
                  selectedExercises.length === 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading ||
                  !routineName.trim() ||
                  selectedExercises.length === 0
                    ? 0.5
                    : 1,
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "20px",
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              >
                check_circle
              </span>
              SAVE ROUTINE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomSingleRoutine;
