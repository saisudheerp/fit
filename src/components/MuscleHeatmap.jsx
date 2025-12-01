import { useState, useEffect } from "react";
import shoulderIcon from "../assets/shoulder.png";
import chestIcon from "../assets/chest.png";
import backIcon from "../assets/back.png";
import absIcon from "../assets/abs.png";
import bicepsIcon from "../assets/biceps.png";
import tricepsIcon from "../assets/triceps.png";
import forearmsIcon from "../assets/forearms.png";
import glutesIcon from "../assets/glutes.png";
import quadsIcon from "../assets/quads.png";
import hamstringsIcon from "../assets/hamstrings.png";
import calvesIcon from "../assets/calves.png";
import cardioIcon from "../assets/cardio.png";

export default function MuscleHeatmap({ weeklyData, monthlyData, onMonthChange }) {
  const [muscleGroups, setMuscleGroups] = useState({});
  const [cardioCount, setCardioCount] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [timePeriod, setTimePeriod] = useState("weekly"); // 'weekly' or 'monthly'
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current, -1 = previous, etc.

  // Muscle groups with their display positions and icons
  const muscles = [
    {
      name: "Shoulders",
      key: "shoulders",
      color: "#4ECDC4",
      icon: shoulderIcon,
      row: 0,
      col: 0,
    },
    {
      name: "Chest",
      key: "chest",
      color: "#FF6B6B",
      icon: chestIcon,
      row: 0,
      col: 1,
    },
    {
      name: "Back",
      key: "back",
      color: "#A8E6CF",
      icon: backIcon,
      row: 0,
      col: 2,
    },
    {
      name: "Abs",
      key: "abs",
      color: "#F38181",
      icon: absIcon,
      row: 0,
      col: 3,
    },
    {
      name: "Biceps",
      key: "biceps",
      color: "#FFD93D",
      icon: bicepsIcon,
      row: 1,
      col: 0,
    },
    {
      name: "Triceps",
      key: "triceps",
      color: "#FFA07A",
      icon: tricepsIcon,
      row: 1,
      col: 1,
    },
    {
      name: "Forearms",
      key: "forearms",
      color: "#95E1D3",
      icon: forearmsIcon,
      row: 1,
      col: 2,
    },
    {
      name: "Glutes",
      key: "glutes",
      color: "#FFAAA6",
      icon: glutesIcon,
      row: 1,
      col: 3,
    },
    {
      name: "Quads",
      key: "quads",
      color: "#667eea",
      icon: quadsIcon,
      row: 2,
      col: 0,
    },
    {
      name: "Hamstrings",
      key: "hamstrings",
      color: "#764ba2",
      icon: hamstringsIcon,
      row: 2,
      col: 1,
    },
    {
      name: "Calves",
      key: "calves",
      color: "#88D8B0",
      icon: calvesIcon,
      row: 2,
      col: 2,
    },
    {
      name: "Cardio",
      key: "cardio",
      color: "#FF6B9D",
      icon: cardioIcon,
      row: 2,
      col: 3,
    },
  ];

  useEffect(() => {
    // Process data to count exercises per muscle group
    const muscleCount = {};
    let cardioTotal = 0;
    let caloriesTotal = 0;
    let totalWorkouts = 0;

    const dataToProcess = timePeriod === "weekly" ? weeklyData : monthlyData;

    if (dataToProcess && dataToProcess.length > 0) {
      dataToProcess.forEach((day) => {
        caloriesTotal += day.calories || 0;

        if (day.exercises && day.exercises.length > 0) {
          totalWorkouts += day.exercises.length;

          day.exercises.forEach((exercise) => {
            // Check if it's cardio
            if (exercise.category === "cardio") {
              cardioTotal++;
              return;
            }

            const primary = Array.isArray(exercise.muscles?.primary)
              ? exercise.muscles.primary
              : [];
            const secondary = Array.isArray(exercise.muscles?.secondary)
              ? exercise.muscles.secondary
              : [];

            // Count primary muscles (full weight)
            primary.forEach((muscle) => {
              if (muscle) {
                const key = muscle.toLowerCase().trim();
                muscleCount[key] = (muscleCount[key] || 0) + 1;
              }
            });

            // Count secondary muscles (half weight)
            secondary.forEach((muscle) => {
              if (muscle) {
                const key = muscle.toLowerCase().trim();
                muscleCount[key] = (muscleCount[key] || 0) + 0.5;
              }
            });
          });
        }
      });
    }

    setMuscleGroups(muscleCount);
    setCardioCount(cardioTotal);
    setTotalCalories(caloriesTotal);
    setTotalWorkouts(totalWorkouts);
  }, [weeklyData, monthlyData, timePeriod]);

  // Get intensity level (0-5) based on exercise count
  const getIntensity = (muscleKey) => {
    const count =
      muscleKey === "cardio" ? cardioCount : muscleGroups[muscleKey] || 0;
    if (count === 0) return 0;
    if (count < 2) return 1;
    if (count < 4) return 2;
    if (count < 6) return 3;
    if (count < 8) return 4;
    return 5;
  };

  // Get color opacity based on intensity
  const getOpacity = (intensity) => {
    const opacities = [0.1, 0.3, 0.5, 0.7, 0.85, 1.0];
    return opacities[intensity];
  };

  const getMonthLabel = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + selectedMonthOffset);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleMonthChange = (offset) => {
    const newOffset = selectedMonthOffset + offset;
    setSelectedMonthOffset(newOffset);
    if (onMonthChange) {
      onMonthChange(newOffset);
    }
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Time Period Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setTimePeriod("weekly")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border:
              timePeriod === "weekly" ? "2px solid #4ECDC4" : "2px solid #333",
            background: timePeriod === "weekly" ? "#4ECDC420" : "#1a1a1a",
            color: timePeriod === "weekly" ? "#4ECDC4" : "#999",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimePeriod("monthly")}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border:
              timePeriod === "monthly" ? "2px solid #4ECDC4" : "2px solid #333",
            background: timePeriod === "monthly" ? "#4ECDC420" : "#1a1a1a",
            color: timePeriod === "monthly" ? "#4ECDC4" : "#999",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Monthly
        </button>
        
        {timePeriod === "monthly" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => handleMonthChange(-1)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #333",
                background: "#1a1a1a",
                color: "#4ECDC4",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_left</span>
            </button>
            <span style={{ color: "#4ECDC4", fontWeight: 600, fontSize: "14px", minWidth: "150px", textAlign: "center" }}>
              {getMonthLabel()}
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              disabled={selectedMonthOffset >= 0}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #333",
                background: selectedMonthOffset >= 0 ? "#0a0a0a" : "#1a1a1a",
                color: selectedMonthOffset >= 0 ? "#555" : "#4ECDC4",
                cursor: selectedMonthOffset >= 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: selectedMonthOffset >= 0 ? 0.5 : 1,
              }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Muscle Grid */}
      <div
        className="muscle-heatmap-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
          maxWidth: "700px",
          margin: "0 auto 24px",
        }}
      >
        {muscles.map((muscle) => {
          const intensity = getIntensity(muscle.key);
          const opacity = getOpacity(intensity);
          const count =
            muscle.key === "cardio"
              ? cardioCount
              : Math.round(muscleGroups[muscle.key] || 0);

          return (
            <div
              key={muscle.key}
              style={{
                gridRow: muscle.row + 1,
                gridColumn: muscle.col + 1,
                background: `linear-gradient(135deg, ${
                  muscle.color
                }${Math.round(opacity * 255)
                  .toString(16)
                  .padStart(2, "0")} 0%, ${muscle.color}${Math.round(
                  opacity * 200
                )
                  .toString(16)
                  .padStart(2, "0")} 100%)`,
                border: `2px solid ${muscle.color}${
                  intensity > 0 ? "80" : "20"
                }`,
                borderRadius: "12px",
                padding: "12px 8px",
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${muscle.color}40`;
                e.currentTarget.style.zIndex = "10";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.zIndex = "1";
              }}
            >
              {/* Muscle icon */}
              <img
                src={muscle.icon}
                alt={muscle.name}
                className="muscle-icon"
                style={{
                  width: "40px",
                  height: "40px",
                  marginBottom: "6px",
                  filter: intensity > 0 ? "none" : "grayscale(1)",
                  opacity: intensity > 0 ? 1 : 0.3,
                  display: "block",
                  margin: "0 auto 8px",
                }}
              />

              {/* Muscle name */}
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color:
                    intensity > 2 ? "#fff" : intensity > 0 ? "#ddd" : "#666",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {muscle.name}
              </div>

              {/* Exercise count */}
              {count > 0 && (
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    fontFamily: "Bebas Neue",
                    color: intensity > 2 ? "#fff" : muscle.color,
                    lineHeight: "1",
                  }}
                >
                  {count}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>
          Intensity:
        </div>
        {["None", "Low", "Moderate", "High", "Very High", "Maximum"].map(
          (label, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#999",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  background: `rgba(102, 126, 234, ${getOpacity(idx)})`,
                  border: "1px solid #667eea40",
                }}
              ></div>
              <span>{label}</span>
            </div>
          )
        )}
      </div>

      {/* Summary Stats */}
      <div
        className="muscle-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: "1px solid #2a2a2a",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#4ECDC4",
              fontFamily: "Bebas Neue",
            }}
          >
            {
              Object.keys(muscleGroups).filter((k) => muscleGroups[k] > 0)
                .length
            }
          </div>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>
            Muscles Worked
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#FFD93D",
              fontFamily: "Bebas Neue",
            }}
          >
            {(() => {
              const sortedMuscles = Object.keys(muscleGroups)
                .filter(k => muscleGroups[k] > 0)
                .sort((a, b) => muscleGroups[b] - muscleGroups[a]);
              
              if (sortedMuscles.length === 0) return "-";
              
              const maxCount = muscleGroups[sortedMuscles[0]];
              const topMuscles = sortedMuscles
                .filter(m => muscleGroups[m] === maxCount)
                .map(m => m.charAt(0).toUpperCase() + m.slice(1));
              
              return topMuscles.join(" • ");
            })()}
          </div>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>
            Most Worked
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#FF6B6B",
              fontFamily: "Bebas Neue",
            }}
          >
            {totalWorkouts}
          </div>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>
            Total Workouts
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#95E1D3",
              fontFamily: "Bebas Neue",
            }}
          >
            {totalCalories.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>
            Calories Burned
          </div>
        </div>
      </div>
    </div>
  );
}
