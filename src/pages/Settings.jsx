import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { updateProfile, getAllPRs, getExerciseHistory, getExercises } from "../lib/firebase-database";
import { signOut } from "../lib/firebase-auth";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Settings() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [bodyWeight, setBodyWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [personalRecords, setPersonalRecords] = useState([]);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [exercises, setExercises] = useState([]);
  
  // PR Search state
  const [prSearchQuery, setPrSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPR, setSelectedPR] = useState(null);
  const [prHistory, setPrHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const allCategories = ["ALL", "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS", "LEGS", "CORE", "CARDIO"];

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBodyWeight(profile.body_weight_kg || 75);
      setHeight(profile.height_cm || 175);
      setAge(profile.age || 25);
      setGender(profile.gender || "male");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      loadExercisesAndPRs();
    }
  }, [user]);

  const loadExercisesAndPRs = async () => {
    try {
      // Load exercises first to get categories
      const allExercises = await getExercises();
      setExercises(allExercises);
      
      // Load PRs and enrich with category data
      const prs = await getAllPRs(user.uid);
      const enrichedPRs = prs.map(pr => {
        const exercise = allExercises.find(e => e.id === pr.exerciseId);
        return {
          ...pr,
          category: exercise?.category || pr.category || "other",
          muscleGroup: exercise?.muscleGroup || pr.muscleGroup || "other"
        };
      });
      setPersonalRecords(enrichedPRs);
    } catch (error) {
      console.error("Error loading PRs:", error);
    } finally {
      setLoadingPRs(false);
    }
  };

  const viewPRDetails = async (pr) => {
    // If clicking the same PR, collapse it
    if (selectedPR?.exerciseId === pr.exerciseId) {
      setSelectedPR(null);
      setPrHistory([]);
      return;
    }
    
    setSelectedPR(pr);
    setLoadingHistory(true);
    setPrHistory([]);
    
    try {
      // Get exercise history for chart
      const history = await getExerciseHistory(user.uid, pr.exerciseId);
      
      // Process history for chart - group by date and get max weight
      const chartData = [];
      const dateMap = new Map();
      
      history.forEach(log => {
        const date = log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : 'N/A');
        const weight = log.weightKg || 0;
        const volume = (log.weightKg || 0) * (log.reps || 0) * (log.sets || 1);
        
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, maxWeight: weight, maxVolume: volume });
        } else {
          const existing = dateMap.get(date);
          if (weight > existing.maxWeight) existing.maxWeight = weight;
          if (volume > existing.maxVolume) existing.maxVolume = volume;
        }
      });
      
      dateMap.forEach(value => chartData.push(value));
      setPrHistory(chartData);
    } catch (error) {
      console.error("Error loading PR history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter PRs based on search and category
  const filteredPRs = personalRecords.filter(pr => {
    const matchesSearch = pr.exerciseName?.toLowerCase().includes(prSearchQuery.toLowerCase());
    const prCategory = (pr.category || "other").toUpperCase();
    const matchesCategory = selectedCategory === "ALL" || prCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count PRs per category
  const categoryCount = allCategories.reduce((acc, cat) => {
    if (cat === "ALL") {
      acc[cat] = personalRecords.length;
    } else {
      acc[cat] = personalRecords.filter(pr => 
        (pr.category || "other").toUpperCase() === cat
      ).length;
    }
    return acc;
  }, {});

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile(user.uid, {
        name: name || null,
        body_weight_kg: bodyWeight,
        height_cm: height,
        age: age,
        gender: gender,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .settings-header h2 {
            font-size: 36px !important;
          }
          .settings-form-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .settings-section {
            padding: 20px !important;
          }
          .bmi-display {
            font-size: 40px !important;
          }
        }
      `}</style>

      <div
        className="settings-header"
        style={{ marginBottom: "48px", animation: "fadeIn 0.5s ease-out" }}
      >
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
          SETTINGS
        </h2>
        <p
          style={{
            color: "#666",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            className="material-icons"
            style={{ fontSize: "20px", color: "#667eea" }}
          >
            settings
          </span>
          Configure your profile and preferences
        </p>
      </div>

      {message && (
        <div
          className="scale-in"
          style={{
            padding: "16px 20px",
            marginBottom: "24px",
            background: message.includes("Error")
              ? "linear-gradient(135deg, #ff6b6b20 0%, #ee5a5a20 100%)"
              : "linear-gradient(135deg, #4ade8020 0%, #22c55e20 100%)",
            color: message.includes("Error") ? "#ff6b6b" : "#4ade80",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            border: `2px solid ${
              message.includes("Error") ? "#ff6b6b" : "#4ade80"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span className="material-icons">
            {message.includes("Error") ? "error" : "check_circle"}
          </span>
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* User Profile */}
        <div
          className="scale-in"
          style={{
            backgroundColor: "#1a1a1a",
            border: "2px solid #2a2a2a",
            borderRadius: "16px",
            padding: "32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Purple accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            }}
          ></div>

          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "Bebas Neue, Impact, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-icons" style={{ color: "#fff" }}>
                person
              </span>
            </div>
            User Profile
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "#999",
                  letterSpacing: "0.05em",
                }}
              >
                NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  backgroundColor: "#0a0a0a",
                  border: "2px solid #2a2a2a",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#999",
                    letterSpacing: "0.05em",
                  }}
                >
                  BODY WEIGHT (KG)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bodyWeight}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setBodyWeight(val === '' ? 0 : Number(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "#0a0a0a",
                    border: "2px solid #2a2a2a",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily: "Roboto Mono, monospace",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#999",
                    letterSpacing: "0.05em",
                  }}
                >
                  HEIGHT (CM)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setHeight(val === '' ? 0 : Number(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "#0a0a0a",
                    border: "2px solid #2a2a2a",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily: "Roboto Mono, monospace",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#999",
                    letterSpacing: "0.05em",
                  }}
                >
                  AGE
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*$/.test(val)) {
                      setAge(val === '' ? 0 : Number(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "#0a0a0a",
                    border: "2px solid #2a2a2a",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "15px",
                    fontFamily: "Roboto Mono, monospace",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "#999",
                    letterSpacing: "0.05em",
                  }}
                >
                  GENDER
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "#0a0a0a",
                    border: "2px solid #2a2a2a",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "15px",
                    outline: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Metrics */}
        <div
          className="scale-in"
          style={{
            backgroundColor: "#1a1a1a",
            border: "2px solid #2a2a2a",
            borderRadius: "16px",
            padding: "32px",
            animationDelay: "0.1s",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "Bebas Neue, Impact, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-icons" style={{ color: "#fff" }}>
                calculate
              </span>
            </div>
            Health Metrics
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                padding: "24px",
                borderRadius: "12px",
                border: "2px solid #667eea40",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#667eea",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}
              >
                STRIDE LENGTH
              </div>
              <div
                style={{
                  fontFamily: "Bebas Neue",
                  fontSize: "48px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.02em",
                }}
              >
                {((height * 0.415) / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: "12px", color: "#999", fontWeight: 600 }}>
                meters
              </div>
            </div>

            <div
              style={{
                background: (() => {
                  const bmi = bodyWeight / (height / 100) ** 2;
                  if (bmi < 18.5)
                    return "linear-gradient(135deg, #FFC13D20 0%, #FFD93D20 100%)";
                  if (bmi < 25)
                    return "linear-gradient(135deg, #A8E6CF20 0%, #88D8B020 100%)";
                  if (bmi < 30)
                    return "linear-gradient(135deg, #FF8E5320 0%, #FFA07A20 100%)";
                  return "linear-gradient(135deg, #FF6B6B20 0%, #EE5A5A20 100%)";
                })(),
                padding: "24px",
                borderRadius: "12px",
                border: (() => {
                  const bmi = bodyWeight / (height / 100) ** 2;
                  if (bmi < 18.5) return "2px solid #FFC13D40";
                  if (bmi < 25) return "2px solid #A8E6CF40";
                  if (bmi < 30) return "2px solid #FF8E5340";
                  return "2px solid #FF6B6B40";
                })(),
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: (() => {
                    const bmi = bodyWeight / (height / 100) ** 2;
                    if (bmi < 18.5) return "#FFC13D";
                    if (bmi < 25) return "#A8E6CF";
                    if (bmi < 30) return "#FF8E53";
                    return "#FF6B6B";
                  })(),
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}
              >
                BMI
              </div>
              <div
                style={{
                  fontFamily: "Bebas Neue",
                  fontSize: "48px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.02em",
                }}
              >
                {(bodyWeight / (height / 100) ** 2).toFixed(1)}
              </div>
              <div style={{ fontSize: "12px", color: "#999", fontWeight: 600 }}>
                {(() => {
                  const bmi = bodyWeight / (height / 100) ** 2;
                  if (bmi < 18.5) return "Underweight";
                  if (bmi < 25) return "Normal Weight";
                  if (bmi < 30) return "Overweight";
                  return "Obese";
                })()}
              </div>
            </div>
          </div>

          {/* BMI Health Advice */}
          <div
            style={{
              background: (() => {
                const bmi = bodyWeight / (height / 100) ** 2;
                if (bmi < 18.5) return "rgba(255, 193, 61, 0.1)";
                if (bmi < 25) return "rgba(168, 230, 207, 0.1)";
                if (bmi < 30) return "rgba(255, 142, 83, 0.1)";
                return "rgba(255, 107, 107, 0.1)";
              })(),
              border: `2px solid ${(() => {
                const bmi = bodyWeight / (height / 100) ** 2;
                if (bmi < 18.5) return "#FFC13D";
                if (bmi < 25) return "#A8E6CF";
                if (bmi < 30) return "#FF8E53";
                return "#FF6B6B";
              })()}`,
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <span
                className="material-icons"
                style={{
                  color: (() => {
                    const bmi = bodyWeight / (height / 100) ** 2;
                    if (bmi < 18.5) return "#FFC13D";
                    if (bmi < 25) return "#A8E6CF";
                    if (bmi < 30) return "#FF8E53";
                    return "#FF6B6B";
                  })(),
                  fontSize: "24px",
                }}
              >
                {(() => {
                  const bmi = bodyWeight / (height / 100) ** 2;
                  if (bmi < 18.5) return "warning";
                  if (bmi < 25) return "check_circle";
                  if (bmi < 30) return "info";
                  return "local_fire_department";
                })()}
              </span>
              <div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Health Recommendation
                </div>
                <div
                  style={{ fontSize: "14px", color: "#999", lineHeight: "1.6" }}
                >
                  {(() => {
                    const bmi = bodyWeight / (height / 100) ** 2;
                    if (bmi < 18.5)
                      return "You may need to gain weight. Aim for 10,000+ steps daily with strength training. Consult a nutritionist for a healthy weight gain plan.";
                    if (bmi < 25)
                      return "Great! Maintain your healthy weight with 7,500-10,000 steps daily and regular exercise. Keep up the good work!";
                    if (bmi < 30)
                      return "Consider increasing activity to 10,000-12,000 steps daily. Combine walking with strength training and a balanced diet for gradual weight loss.";
                    return "Focus on gradual increase in activity. Start with 5,000 steps and work up to 12,000+. Consult a healthcare provider for personalized guidance.";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Records */}
        <div
          className="settings-section"
          style={{
            background: "#111",
            border: "1px solid #1f1f1f",
            borderRadius: "20px",
            padding: "32px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "14px",
                color: "#fff",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(145deg, #D4AF37 0%, #B8860B 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.25)",
                }}
              >
                <span className="material-icons" style={{ fontSize: "22px", color: "#000" }}>
                  emoji_events
                </span>
              </div>
              Personal Records
            </h3>
            <div style={{ 
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid rgba(212, 175, 55, 0.2)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#D4AF37"
            }}>
              {personalRecords.length} PRs
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              backgroundColor: "#0a0a0a",
              border: "1px solid #1f1f1f",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <span className="material-icons" style={{ color: "#555", fontSize: "20px" }}>
              search
            </span>
            <input
              type="text"
              placeholder="Search your personal records..."
              value={prSearchQuery}
              onChange={(e) => setPrSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "14px",
              }}
            />
            {prSearchQuery && (
              <button
                onClick={() => setPrSearchQuery("")}
                style={{
                  background: "#2a2a2a",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-icons" style={{ color: "#999", fontSize: "16px" }}>
                  close
                </span>
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {allCategories.map((cat) => {
              const count = categoryCount[cat] || 0;
              const isActive = selectedCategory === cat;
              const hasRecords = cat === "ALL" || count > 0;
              
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedPR(null);
                    setPrHistory([]);
                  }}
                  disabled={!hasRecords && cat !== "ALL"}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: isActive 
                      ? "linear-gradient(145deg, #D4AF37 0%, #B8860B 100%)"
                      : hasRecords ? "#1a1a1a" : "#0f0f0f",
                    color: isActive ? "#000" : hasRecords ? "#888" : "#333",
                    fontSize: "10px",
                    fontWeight: 600,
                    cursor: hasRecords ? "pointer" : "default",
                    transition: "all 0.2s",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    opacity: hasRecords ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {cat}
                  {count > 0 && (
                    <span
                      style={{
                        background: isActive ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected PR Detail View */}
          {selectedPR && (
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #1f1f1f",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      background: "linear-gradient(145deg, #D4AF37 0%, #B8860B 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 16px rgba(212, 175, 55, 0.3)",
                    }}
                  >
                    <span className="material-icons" style={{ color: "#000", fontSize: "26px" }}>
                      emoji_events
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                      {selectedPR.exerciseName}
                    </div>
                    <div style={{ 
                      fontSize: "11px", 
                      color: "#666", 
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                      {selectedPR.category || "Exercise"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPR(null);
                    setPrHistory([]);
                  }}
                  style={{
                    background: "#2a2a2a",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span className="material-icons" style={{ color: "#999" }}>close</span>
                </button>
              </div>

              {/* PR Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    background: "#111",
                    borderRadius: "12px",
                    padding: "20px 16px",
                    textAlign: "center",
                    border: "1px solid #1f1f1f",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Weight</div>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#D4AF37", fontFamily: "Bebas Neue", letterSpacing: "0.02em" }}>
                    {selectedPR.maxWeight}<span style={{ fontSize: "14px", color: "#666", marginLeft: "2px" }}>kg</span>
                  </div>
                  {selectedPR.maxWeightDate && (
                    <div style={{ fontSize: "10px", color: "#444", marginTop: "8px" }}>
                      {new Date(selectedPR.maxWeightDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: "#111",
                    borderRadius: "12px",
                    padding: "20px 16px",
                    textAlign: "center",
                    border: "1px solid #1f1f1f",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Reps</div>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#fff", fontFamily: "Bebas Neue", letterSpacing: "0.02em" }}>
                    {selectedPR.maxReps}
                  </div>
                  {selectedPR.maxRepsDate && (
                    <div style={{ fontSize: "10px", color: "#444", marginTop: "8px" }}>
                      {new Date(selectedPR.maxRepsDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: "#111",
                    borderRadius: "12px",
                    padding: "20px 16px",
                    textAlign: "center",
                    border: "1px solid #1f1f1f",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Volume</div>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#888", fontFamily: "Bebas Neue", letterSpacing: "0.02em" }}>
                    {selectedPR.maxVolume}
                  </div>
                  {selectedPR.maxVolumeDate && (
                    <div style={{ fontSize: "10px", color: "#444", marginTop: "8px" }}>
                      {new Date(selectedPR.maxVolumeDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Chart */}
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#444" }}>
                  <span className="material-icons rotating" style={{ fontSize: "20px", color: "#D4AF37" }}>sync</span>
                  <p style={{ marginTop: "8px", fontSize: "12px" }}>Loading...</p>
                </div>
              ) : prHistory.length > 1 ? (
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #1f1f1f" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#555", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <span className="material-icons" style={{ fontSize: "16px", color: "#D4AF37" }}>trending_up</span>
                    Progress
                  </div>
                  <div style={{ height: "160px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#333" 
                          fontSize={10}
                          tickFormatter={(value) => {
                            if (!value || value === 'N/A') return '';
                            const parts = value.split('/');
                            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : value;
                          }}
                        />
                        <YAxis stroke="#333" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            background: "#111",
                            border: "1px solid #2a2a2a",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(value, name) => [
                            name === "maxWeight" ? `${value}kg` : value,
                            name === "maxWeight" ? "Weight" : "Volume"
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          stroke="#D4AF37"
                          strokeWidth={2}
                          dot={{ fill: "#D4AF37", strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: "#fff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#444", fontSize: "12px", marginTop: "16px", borderTop: "1px solid #1f1f1f", paddingTop: "24px" }}>
                  <span className="material-icons" style={{ fontSize: "20px", marginBottom: "8px", display: "block", color: "#333" }}>show_chart</span>
                  Log more to see progress
                </div>
              )}
            </div>
          )}

          {/* PRs List */}
          {loadingPRs ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <span className="material-icons rotating" style={{ fontSize: "48px" }}>sync</span>
              <p style={{ marginTop: "16px" }}>Loading PRs...</p>
            </div>
          ) : personalRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "linear-gradient(145deg, #D4AF3715 0%, #B8860B10 100%)",
                  border: "1px solid #D4AF3720",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <span className="material-icons" style={{ fontSize: "28px", color: "#D4AF3760" }}>emoji_events</span>
              </div>
              <p style={{ color: "#555", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                No personal records yet<br/>
                <span style={{ color: "#444" }}>Start logging to track PRs</span>
              </p>
            </div>
          ) : filteredPRs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#151515",
                  border: "1px solid #222",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <span className="material-icons" style={{ fontSize: "22px", color: "#444" }}>search_off</span>
              </div>
              <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>
                No results for "<span style={{ color: "#D4AF37" }}>{prSearchQuery}</span>"
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredPRs.map((pr, idx) => (
                <div
                  key={idx}
                  onClick={() => viewPRDetails(pr)}
                  style={{
                    background: selectedPR?.exerciseId === pr.exerciseId 
                      ? "#151515" 
                      : "#0a0a0a",
                    border: `1px solid ${selectedPR?.exerciseId === pr.exerciseId ? "#D4AF3740" : "#1a1a1a"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPR?.exerciseId !== pr.exerciseId) {
                      e.currentTarget.style.borderColor = "#2a2a2a";
                      e.currentTarget.style.background = "#0f0f0f";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPR?.exerciseId !== pr.exerciseId) {
                      e.currentTarget.style.borderColor = "#1a1a1a";
                      e.currentTarget.style.background = "#0a0a0a";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#151515",
                        border: "1px solid #222",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: "18px", color: "#D4AF37" }}>
                        fitness_center
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "3px" }}>
                        {pr.exerciseName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#444", display: "flex", gap: "12px" }}>
                        <span><span style={{ color: "#D4AF37" }}>{pr.maxWeight}</span>kg</span>
                        <span><span style={{ color: "#888" }}>{pr.maxReps}</span> reps</span>
                        <span><span style={{ color: "#555" }}>{pr.maxVolume}</span> vol</span>
                      </div>
                    </div>
                  </div>
                  <span className="material-icons" style={{ color: "#333", fontSize: "18px" }}>
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="scale-in"
          style={{ display: "flex", gap: "16px", animationDelay: "0.2s" }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "16px",
              background: saving
                ? "#666"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
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
                : "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 8px 20px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            <span className="material-icons">
              {saving ? "hourglass_empty" : "save"}
            </span>
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            style={{
              flex: 1,
              padding: "16px",
              background: "transparent",
              color: "#999",
              border: "2px solid #2a2a2a",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#fff";
              e.target.style.color = "#fff";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#2a2a2a";
              e.target.style.color = "#999";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <span className="material-icons">refresh</span>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
