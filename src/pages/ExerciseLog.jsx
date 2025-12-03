import { useState, useEffect } from "react";
import {
  getExercises,
  createWorkoutSession,
  logExercise,
  checkAndUpdatePR,
  getPR,
  getLocalDateString,
} from "../lib/firebase-database";
import { calculateExerciseCalories } from "../lib/calorieEngine";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function ExerciseLog() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [duration, setDuration] = useState(60); // Changed to seconds for timed exercises
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBodyPart, setFilterBodyPart] = useState("all");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPR, setCurrentPR] = useState(null);
  const [newPRAlert, setNewPRAlert] = useState(null);

  // Get body weight from profile
  const bodyWeight = profile?.body_weight_kg || 75;

  // Helper function to get simple target description
  const getSimpleTarget = (exercise) => {
    const name = exercise.name.toLowerCase();

    // Chest exercises
    if (name.includes("incline")) return "Upper Chest";
    if (name.includes("decline")) return "Lower Chest";
    if (
      name.includes("chest") ||
      name.includes("bench") ||
      name.includes("push-up") ||
      name.includes("fly")
    )
      return "Middle Chest";

    // Back exercises
    if (
      name.includes("pull-up") ||
      name.includes("pulldown") ||
      name.includes("lat")
    )
      return "Back Width";
    if (name.includes("row") || name.includes("deadlift"))
      return "Back Thickness";
    if (name.includes("shrug")) return "Upper Traps";

    // Shoulder exercises
    if (name.includes("overhead") || name.includes("military"))
      return "Front Shoulders";
    if (name.includes("lateral")) return "Side Shoulders";
    if (name.includes("rear") || name.includes("reverse"))
      return "Rear Shoulders";
    if (name.includes("shoulder")) return "Full Shoulders";

    // Arm exercises
    if (name.includes("curl")) return "Biceps";
    if (
      name.includes("tricep") ||
      name.includes("extension") ||
      name.includes("dip")
    )
      return "Triceps";

    // Leg exercises
    if (name.includes("squat")) return "Full Legs";
    if (name.includes("lunge")) return "Quads & Glutes";
    if (name.includes("leg press")) return "Quads";
    if (name.includes("leg curl")) return "Hamstrings";
    if (name.includes("leg extension")) return "Quads";
    if (name.includes("calf")) return "Calves";

    // Core exercises
    if (name.includes("plank")) return "Core Stability";
    if (name.includes("crunch") || name.includes("sit-up")) return "Upper Abs";
    if (name.includes("leg raise")) return "Lower Abs";

    // Cardio
    if (name.includes("running") || name.includes("treadmill"))
      return "Full Body Cardio";
    if (name.includes("cycling")) return "Lower Body Cardio";
    if (name.includes("rowing")) return "Full Body Cardio";

    // Forearms
    if (name.includes("wrist") || name.includes("forearm")) return "Forearms";

    // Default fallback - capitalize body part
    return exercise.body_part
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (selectedExercise && user) {
      loadPR();
    } else {
      setCurrentPR(null);
    }
  }, [selectedExercise, user]);

  const loadPR = async () => {
    if (!selectedExercise || !user) return;
    try {
      const pr = await getPR(user.uid, selectedExercise.id);
      setCurrentPR(pr);
    } catch (error) {
      // Silent fail - PR might not exist yet, which is normal
      setCurrentPR(null);
    }
  };

  // Calculate calories whenever inputs change
  useEffect(() => {
    if (selectedExercise) {
      const isTimed =
        selectedExercise.type === "timed" || selectedExercise.type === "cardio";

      // Calculate duration based on exercise type
      let durationInMinutes;
      if (isTimed) {
        // Timed/cardio exercises: use actual duration in seconds, convert to minutes
        durationInMinutes = duration / 60;
      } else {
        // Strength/bodyweight: estimate ~3 seconds per rep (no rest time counted)
        const repTime = (reps * 3 * sets) / 60; // Convert to minutes
        durationInMinutes = repTime;
      }

      const calc = calculateExerciseCalories(
        {
          type: selectedExercise.type,
          met: selectedExercise.met,
          volumeCoefficient: selectedExercise.volume_coefficient,
        },
        {
          bodyWeightKg: bodyWeight,
          durationMinutes: durationInMinutes,
          weightKg: weight,
          reps,
          sets,
        }
      );
      setResult(calc);
    }
  }, [selectedExercise, sets, reps, weight, duration, bodyWeight]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const bodyParts = ["all", ...new Set(exercises.map((e) => e.body_part))];

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterBodyPart === "all" || exercise.body_part === filterBodyPart;
    return matchesSearch && matchesFilter;
  });

  const handleSave = async () => {
    if (!result || !user || !selectedExercise) return;

    setSaving(true);
    try {
      // Create session for today
      const sessionId = await createWorkoutSession(user.uid, {
        date: getLocalDateString(),
      });

      const isTimed =
        selectedExercise.type === "timed" || selectedExercise.type === "cardio";

      // Calculate duration based on exercise type
      let durationInMinutes;
      if (isTimed) {
        durationInMinutes = duration / 60;
      } else {
        // For strength/bodyweight: estimate based on reps (no rest time)
        const repTime = (reps * 3 * sets) / 60;
        durationInMinutes = repTime;
      }

      // Log the exercise
      await logExercise(user.uid, {
        sessionId,
        exerciseId: selectedExercise.id,
        sets: isTimed ? 1 : sets, // Timed exercises only have 1 set
        reps: isTimed ? 0 : reps, // Timed exercises don't have reps
        weightKg: isTimed ? 0 : weight, // Timed exercises don't use weight
        durationMinutes: isTimed ? durationInMinutes : 0, // Only log duration for timed exercises
        durationSeconds: isTimed ? duration : 0, // Store seconds for timed exercises
        caloriesBurned: result.totalCalories,
        volume: result.volume,
        date: getLocalDateString(),
      });

      // Check for PR (only for strength exercises with weight)
      if (!isTimed && weight > 0) {
        const prResult = await checkAndUpdatePR(
          user.uid,
          selectedExercise.id,
          selectedExercise.name,
          weight,
          reps,
          sets
        );

        if (prResult.isNewPR) {
          setNewPRAlert(prResult);
          setTimeout(() => setNewPRAlert(null), 5000);
        }
      }

      toast.success("Exercise logged successfully!");
      setResult(null);
      setSelectedExercise(null);
      setCurrentPR(null);
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("Failed to save exercise: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
  };

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "40px 24px",
        position: "relative",
      }}
    >
      {/* New PR Alert */}
      {newPRAlert && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            right: "24px",
            zIndex: 1000,
            background: "#111",
            border: "1px solid #D4AF3750",
            borderRadius: "12px",
            padding: "16px 20px",
            maxWidth: "280px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            animation: "slideInRight 0.4s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(145deg, #D4AF37 0%, #B8860B 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-icons" style={{ fontSize: "22px", color: "#000" }}>emoji_events</span>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#D4AF37",
                  letterSpacing: "0.05em",
                  marginBottom: "2px",
                }}
              >
                NEW PR!
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {selectedExercise?.name}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#666", display: "flex", gap: "12px" }}>
            {newPRAlert.prType.includes("weight") && (
              <span><span style={{ color: "#D4AF37" }}>{newPRAlert.data.weight}</span>kg</span>
            )}
            {newPRAlert.prType.includes("reps") && (
              <span><span style={{ color: "#fff" }}>{newPRAlert.data.reps}</span> reps</span>
            )}
            {newPRAlert.prType.includes("volume") && (
              <span><span style={{ color: "#888" }}>{newPRAlert.data.volume}</span> vol</span>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .exercise-log-header h2 {
            font-size: 36px !important;
          }
          .exercise-log-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .exercise-search {
            position: relative !important;
          }
          .exercise-list {
            max-height: 400px !important;
          }
          .input-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .button-group {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .button-group button {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Header */}
      <div
        className="exercise-log-header"
        style={{ marginBottom: "40px", animation: "fadeIn 0.5s ease-out" }}
      >
        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "56px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background:
              "linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD93D 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 40px rgba(255, 107, 53, 0.3)",
          }}
        >
          LOG EXERCISE
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
            style={{ fontSize: "20px", color: "#FF6B35" }}
          >
            edit_note
          </span>
          Track your workout and calculate calories burned
        </p>
      </div>

      <div
        className="exercise-log-grid"
        style={{
          display: "grid",
          gridTemplateColumns: selectedExercise ? "400px 1fr" : "1fr",
          gap: "32px",
          transition: "all 0.3s",
        }}
      >
        {/* Exercise Selection */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
            border: "2px solid #2a2a2a",
            borderRadius: "20px",
            padding: "28px",
            transition: "all 0.3s",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Orange gradient overlay at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "100px",
              background:
                "linear-gradient(180deg, rgba(255, 107, 53, 0.08) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          ></div>

          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#fff",
              fontFamily: "Bebas Neue, Impact, sans-serif",
              letterSpacing: "0.08em",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span
              className="material-icons"
              style={{
                fontSize: "24px",
                color: "#FF6B35",
                textShadow: "0 0 20px rgba(255, 107, 53, 0.6)",
              }}
            >
              fitness_center
            </span>
            Select Exercise
          </h3>

          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...inputStyle,
              marginBottom: "16px",
              transition: "all 0.2s",
              borderColor: searchTerm ? "#FF6B35" : "#2a2a2a",
              boxShadow: searchTerm
                ? "0 0 20px rgba(255, 107, 53, 0.2)"
                : "none",
              position: "relative",
              zIndex: 1,
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            {bodyParts.map((part) => (
              <button
                key={part}
                onClick={() => setFilterBodyPart(part)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 700,
                  border:
                    filterBodyPart === part ? "2px solid #FF6B35" : "none",
                  cursor: "pointer",
                  background:
                    filterBodyPart === part
                      ? "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)"
                      : "#2a2a2a",
                  color: filterBodyPart === part ? "#fff" : "#999",
                  transition: "all 0.2s",
                  transform:
                    filterBodyPart === part ? "scale(1.05)" : "scale(1)",
                  boxShadow:
                    filterBodyPart === part
                      ? "0 4px 15px rgba(255, 107, 53, 0.4)"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  if (filterBodyPart !== part) {
                    e.target.style.backgroundColor = "#3a3a3a";
                    e.target.style.color = "#ccc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterBodyPart !== part) {
                    e.target.style.backgroundColor = "#2a2a2a";
                    e.target.style.color = "#999";
                  }
                }}
              >
                {part}
              </button>
            ))}
          </div>

          <div
            style={{
              maxHeight: selectedExercise ? "400px" : "500px",
              overflowY: "auto",
              paddingRight: "8px",
              transition: "max-height 0.3s",
            }}
          >
            {loading ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <span
                  className="material-icons rotating"
                  style={{ fontSize: "48px", marginBottom: "16px" }}
                >
                  sync
                </span>
                <p>Loading exercises...</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: "48px", marginBottom: "16px" }}
                >
                  search_off
                </span>
                <p>No exercises found</p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "14px",
                    marginBottom: "8px",
                    borderRadius: "12px",
                    border:
                      selectedExercise?.id === exercise.id
                        ? "2px solid #FF6B35"
                        : "1px solid #2a2a2a",
                    cursor: "pointer",
                    background:
                      selectedExercise?.id === exercise.id
                        ? "linear-gradient(135deg, #FF6B3515 0%, #F7931E08 100%)"
                        : "#0a0a0a",
                    color:
                      selectedExercise?.id === exercise.id ? "#FF6B35" : "#fff",
                    transition: "all 0.2s",
                    boxShadow:
                      selectedExercise?.id === exercise.id
                        ? "0 4px 15px rgba(255, 107, 53, 0.3)"
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedExercise?.id !== exercise.id) {
                      e.currentTarget.style.background = "#1a1a1a";
                      e.currentTarget.style.borderColor = "#3a3a3a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedExercise?.id !== exercise.id) {
                      e.currentTarget.style.background = "#0a0a0a";
                      e.currentTarget.style.borderColor = "#2a2a2a";
                    }
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "15px",
                      marginBottom: "6px",
                    }}
                  >
                    {exercise.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color:
                        selectedExercise?.id === exercise.id ? "#999" : "#666",
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>
                      {exercise.body_part}
                    </span>
                    <span>•</span>
                    <span style={{ textTransform: "capitalize" }}>
                      {exercise.type}
                    </span>
                    <span>•</span>
                    <span>MET {exercise.met}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Exercise Details & Input */}
        <div>
          {selectedExercise ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                animation: "slideIn 0.3s ease-out",
              }}
            >
              {/* Exercise Animation & Info */}
              <div
                style={{
                  background:
                    "radial-gradient(circle at top left, rgba(255, 107, 53, 0.08) 0%, #1a1a1a 50%)",
                  border: "2px solid rgba(255, 107, 53, 0.3)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  padding: "28px",
                  boxShadow: "0 4px 20px rgba(255, 107, 53, 0.2)",
                  position: "relative",
                }}
              >
                {/* Animated gradient orb */}
                <div
                  style={{
                    position: "absolute",
                    top: "-60px",
                    left: "-60px",
                    width: "150px",
                    height: "150px",
                    background:
                      "radial-gradient(circle, rgba(255, 107, 53, 0.2) 0%, transparent 70%)",
                    pointerEvents: "none",
                    filter: "blur(30px)",
                    animation: "pulse 3s ease-in-out infinite",
                  }}
                ></div>

                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#fff",
                    fontFamily: "Bebas Neue, Impact, sans-serif",
                    letterSpacing: "0.05em",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {selectedExercise.name}
                </h3>
                <p
                  style={{
                    color: "#999",
                    fontSize: "13px",
                    marginBottom: "20px",
                    textTransform: "capitalize",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ fontSize: "14px", color: "#FF6B35" }}
                  >
                    category
                  </span>
                  {selectedExercise.body_part} • {selectedExercise.equipment}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    fontSize: "14px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <InfoItem
                    label="Difficulty"
                    value={selectedExercise.difficulty}
                  />
                  <InfoItem
                    label="Intensity"
                    value={`${selectedExercise.met} MET`}
                    mono
                  />
                  <InfoItem
                    label="Target"
                    value={getSimpleTarget(selectedExercise)}
                  />
                </div>
              </div>

              {/* Input Form */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
                  border: "2px solid #2a2a2a",
                  borderRadius: "20px",
                  padding: "28px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontFamily: "Bebas Neue, Impact, sans-serif",
                    letterSpacing: "0.08em",
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ fontSize: "24px", color: "#F7931E" }}
                  >
                    edit_note
                  </span>
                  Log Details
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: "#ccc",
                      }}
                    >
                      Body Weight (kg)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bodyWeight}
                      disabled
                      style={{
                        ...inputStyle,
                        backgroundColor: "#0a0a0a",
                        color: "#666",
                        cursor: "not-allowed",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      From your profile
                    </p>
                  </div>

                  {/* Strength exercises with weights */}
                  {selectedExercise.type === "strength" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <InputField
                        label="Sets"
                        value={sets}
                        onChange={setSets}
                      />
                      <InputField
                        label="Reps"
                        value={reps}
                        onChange={setReps}
                      />
                      <InputField
                        label="Weight (kg)"
                        value={weight}
                        onChange={setWeight}
                      />
                    </div>
                  )}

                  {/* Bodyweight exercises (no weight needed) */}
                  {selectedExercise.type === "bodyweight" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <InputField
                        label="Sets"
                        value={sets}
                        onChange={setSets}
                      />
                      <InputField
                        label="Reps"
                        value={reps}
                        onChange={setReps}
                      />
                    </div>
                  )}

                  {/* Timed exercises (duration only - like Plank, Dead Hang) */}
                  {selectedExercise.type === "timed" && (
                    <>
                      <InputField
                        label="Duration (seconds)"
                        value={duration}
                        onChange={setDuration}
                      />
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        ⏱️ Time-based exercise - duration in seconds (calories
                        will be calculated based on time)
                      </p>
                    </>
                  )}

                  {/* Cardio exercises (duration only) */}
                  {selectedExercise.type === "cardio" && (
                    <>
                      <InputField
                        label="Duration (seconds)"
                        value={duration}
                        onChange={setDuration}
                      />
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        Cardio exercise - duration in seconds
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Results - Only show calories */}
              {result && (
                <>
                  {/* Personal Records Display */}
                  {currentPR &&
                    selectedExercise.type === "strength" &&
                    weight > 0 && (
                      <div
                        style={{
                          backgroundColor: "#0a0a0a",
                          border: "2px solid #FFD93D40",
                          borderRadius: "16px",
                          padding: "20px",
                          marginBottom: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          <span
                            className="material-icons"
                            style={{ color: "#FFD93D", fontSize: "24px" }}
                          >
                            emoji_events
                          </span>
                          <h4
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "#FFD93D",
                              fontFamily: "Bebas Neue",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Current Personal Records
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: "#121212",
                              borderRadius: "8px",
                              padding: "12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color:
                                  weight > currentPR.maxWeight
                                    ? "#4ECDC4"
                                    : "#fff",
                                fontFamily: "Bebas Neue",
                              }}
                            >
                              {currentPR.maxWeight}kg
                            </div>
                            <div style={{ fontSize: "11px", color: "#999" }}>
                              Max Weight
                            </div>
                          </div>
                          <div
                            style={{
                              background: "#121212",
                              borderRadius: "8px",
                              padding: "12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color:
                                  reps > currentPR.maxReps ? "#4ECDC4" : "#fff",
                                fontFamily: "Bebas Neue",
                              }}
                            >
                              {currentPR.maxReps}
                            </div>
                            <div style={{ fontSize: "11px", color: "#999" }}>
                              Max Reps
                            </div>
                          </div>
                          <div
                            style={{
                              background: "#121212",
                              borderRadius: "8px",
                              padding: "12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color:
                                  weight * reps * sets > currentPR.maxVolume
                                    ? "#4ECDC4"
                                    : "#fff",
                                fontFamily: "Bebas Neue",
                              }}
                            >
                              {currentPR.maxVolume}
                            </div>
                            <div style={{ fontSize: "11px", color: "#999" }}>
                              Max Volume
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <div
                    style={{
                      backgroundColor: "#1a1a1a",
                      border: "2px solid #fff",
                      borderRadius: "16px",
                      padding: "32px",
                      textAlign: "center",
                      animation: "scaleIn 0.3s ease-out",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Background glow effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "200px",
                        height: "200px",
                        background:
                          "radial-gradient(circle, rgba(255,107,53,0.2) 0%, rgba(255,107,53,0) 70%)",
                        pointerEvents: "none",
                      }}
                    ></div>

                    <div
                      style={{
                        fontSize: "72px",
                        fontWeight: 700,
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        position: "relative",
                        fontFamily: "Bebas Neue, Impact, sans-serif",
                        letterSpacing: "0.02em",
                      }}
                    >
                      <span
                        className="material-icons pulse"
                        style={{ fontSize: "64px", color: "#ff6b35" }}
                      >
                        local_fire_department
                      </span>
                      {Math.round(result.totalCalories)}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#666",
                        marginBottom: "32px",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        fontWeight: 700,
                      }}
                    >
                      Calories Burned
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        width: "100%",
                        padding: "18px",
                        backgroundColor: saving ? "#666" : "#fff",
                        color: "#000",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                        boxShadow: saving
                          ? "none"
                          : "0 4px 12px rgba(255,255,255,0.2)",
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 6px 16px rgba(255,255,255,0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 4px 12px rgba(255,255,255,0.2)";
                        }
                      }}
                    >
                      <span className="material-icons">
                        {saving ? "hourglass_empty" : "save"}
                      </span>
                      {saving ? "Saving..." : "Save Calories"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "80px 32px",
                textAlign: "center",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "96px",
                  color: "#2a2a2a",
                  marginBottom: "24px",
                }}
              >
                fitness_center
              </span>
              <p style={{ color: "#666", fontSize: "16px" }}>
                Select an exercise to start logging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <div
        style={{
          color: "#666",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "6px",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "15px",
          textTransform: "capitalize",
          fontFamily: mono ? "Roboto Mono, monospace" : "inherit",
        }}
      >
        {value}
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
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "#ccc",
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
            onChange(val === '' ? 0 : Number(val));
          }
        }}
        style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "#0a0a0a",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "15px",
          fontFamily: "Roboto Mono, monospace",
          outline: "none",
        }}
      />
    </div>
  );
}

function ResultItem({ label, value, unit, primary }) {
  return (
    <div
      style={{
        backgroundColor: primary ? "#fff" : "#0a0a0a",
        padding: "20px",
        borderRadius: "10px",
        border: primary ? "none" : "1px solid #2a2a2a",
      }}
    >
      <div
        style={{
          color: primary ? "#666" : "#666",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "8px",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Roboto Mono, monospace",
          fontSize: primary ? "36px" : "28px",
          fontWeight: 700,
          color: primary ? "#000" : "#fff",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: primary ? "#999" : "#666",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {unit}
      </div>
    </div>
  );
}
