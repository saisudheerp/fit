import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getWorkoutSessions, getExerciseLogs } from "../lib/firebase-database";

export default function History() {
  const { user } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const [sessionsData, logsData] = await Promise.all([
        getWorkoutSessions(user.uid),
        getExerciseLogs(user.uid, new Date().toISOString().split("T")[0]),
      ]);
      setSessions(sessionsData);
      setLogs(logsData);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .history-header h2 {
            font-size: 36px !important;
          }
          .history-table {
            overflow-x: auto !important;
          }
          .history-table table {
            font-size: 13px !important;
          }
          .history-table th,
          .history-table td {
            padding: 10px 8px !important;
          }
        }
      `}</style>

      <div
        className="history-header"
        style={{ marginBottom: "40px", animation: "fadeIn 0.5s ease-out" }}
      >
        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "64px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          HISTORY
        </h2>
        <p style={{ color: "#999", fontSize: "16px", fontWeight: 500 }}>
          <span
            className="material-icons"
            style={{ fontSize: "20px", color: "#FFD93D" }}
          >
            bar_chart
          </span>
          Your workout history and progress
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#0a0a0a",
          border: "none",
          borderRadius: "16px",
          padding: "24px",
          minHeight: "400px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "20px solid #1a1a1a",
            opacity: 0.4,
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            left: "-50px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            border: "15px solid #1a1a1a",
            opacity: 0.3,
          }}
        ></div>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}
          >
            <span
              className="material-icons rotating"
              style={{ fontSize: "64px", marginBottom: "16px" }}
            >
              sync
            </span>
            <p>Loading history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}
          >
            <span
              className="material-icons pulse"
              style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.3 }}
            >
              history
            </span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "12px",
                color: "#999",
              }}
            >
              No workout history yet
            </h3>
            <p
              style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}
            >
              Start logging exercises to track your progress
            </p>
            <a
              href="/log"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 32px",
                background: "linear-gradient(135deg, #B19CD9 0%, #9B7EBD 100%)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(177, 156, 217, 0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(177, 156, 217, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(177, 156, 217, 0.4)";
              }}
            >
              <span className="material-icons">add_circle</span>
              Log First Exercise
            </a>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "12px",
                fontFamily: "Bebas Neue, Impact, sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              Today's Workouts ({logs.length})
            </h3>
            {logs.map((log, idx) => (
              <div
                key={idx}
                className="scale-in"
                style={{
                  padding: "0",
                  background: "#0a0a0a",
                  borderRadius: "16px",
                  border: "none",
                  transition: "all 0.3s",
                  animationDelay: `${idx * 0.1}s`,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                }}
              >
                {/* Top colored strip */}
                <div
                  style={{
                    height: "4px",
                    background: `linear-gradient(90deg, ${
                      [
                        "#FF6B6B",
                        "#4ECDC4",
                        "#FFD93D",
                        "#A8E6CF",
                        "#FFB6B9",
                        "#B19CD9",
                      ][idx % 6]
                    } 0%, transparent 100%)`,
                  }}
                ></div>

                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#fff",
                        fontFamily: "Bebas Neue, Impact, sans-serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {log.exerciseName}
                    </div>
                    {log.caloriesBurned > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          background:
                            "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
                          borderRadius: "20px",
                          boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
                        }}
                      >
                        <span
                          className="material-icons pulse"
                          style={{ fontSize: "16px", color: "#fff" }}
                        >
                          local_fire_department
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#fff",
                            fontFamily: "Bebas Neue",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {Math.round(log.caloriesBurned)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      fontFamily: "Roboto Mono, monospace",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{ fontSize: "12px" }}
                    >
                      schedule
                    </span>
                    {new Date(
                      log.createdAt?.seconds * 1000 || Date.now()
                    ).toLocaleString()}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        padding: "12px",
                        background:
                          "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "9px",
                          color: "#666",
                          marginBottom: "6px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                        }}
                      >
                        SETS
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 700,
                          fontFamily: "Bebas Neue",
                          color: "#fff",
                        }}
                      >
                        {log.sets}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "12px",
                        background:
                          "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
                        borderRadius: "12px",
                        textAlign: "center",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "9px",
                          color: "#666",
                          marginBottom: "6px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {log.reps === 0 && log.durationSeconds
                          ? "DURATION"
                          : "REPS"}
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 700,
                          fontFamily: "Bebas Neue",
                          color: "#fff",
                        }}
                      >
                        {log.reps === 0 && log.durationSeconds
                          ? `${log.durationSeconds}s`
                          : log.reps}
                      </div>
                    </div>
                    {log.weightKg > 0 && (
                      <div
                        style={{
                          flex: 1,
                          padding: "12px",
                          background:
                            "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
                          borderRadius: "12px",
                          textAlign: "center",
                          border: "1px solid #2a2a2a",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#666",
                            marginBottom: "6px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                          }}
                        >
                          WEIGHT
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            fontFamily: "Bebas Neue",
                            color: "#fff",
                          }}
                        >
                          {log.weightKg}kg
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
