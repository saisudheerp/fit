import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { getUserStats, getRecentLogs, getWeeklyStats } from "../lib/firebase-database";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalCalories: 0,
    totalSteps: 0,
    workoutsToday: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log("Loading dashboard data for user:", user.uid);
      const [statsData, logs, weekly] = await Promise.all([
        getUserStats(user.uid),
        getRecentLogs(user.uid, 1),
        getWeeklyStats(user.uid),
      ]);
      console.log("Dashboard stats:", statsData);
      console.log("Recent logs:", logs);
      console.log("Weekly stats:", weekly);
      setStats(statsData);
      setRecentLogs(logs);
      setWeeklyStats(weekly);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      icon: "local_fire_department",
      label: "Calories Burned",
      value: stats.totalCalories.toFixed(0),
      unit: "kcal",
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
      color: "#FF6B6B",
      glow: "rgba(255, 107, 107, 0.3)",
    },
    {
      icon: "timeline",
      label: "Workouts Today",
      value: stats.workoutsToday.toString(),
      unit: "sessions",
      gradient: "linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%)",
      color: "#A8E6CF",
      glow: "rgba(168, 230, 207, 0.3)",
    },
  ];

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-header h2 {
            font-size: 36px !important;
          }
          .dashboard-stats {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .dashboard-panels {
            grid-template-columns: 1fr !important;
          }
          .stat-card {
            padding: 20px !important;
          }
          .stat-value {
            font-size: 40px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: "48px", animation: "fadeIn 0.5s ease-out" }}>
        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "64px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background:
              "linear-gradient(135deg, #A8E6CF 0%, #4ECDC4 35%, #88D8B0 70%, #66D9A5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 40px rgba(168, 230, 207, 0.2)",
          }}
        >
          {profile?.name
            ? `WELCOME, ${profile.name.toUpperCase()}`
            : "DASHBOARD"}
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            className="material-icons pulse"
            style={{ fontSize: "20px", color: "#A8E6CF" }}
          >
            local_fire_department
          </span>
          Your fitness overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="dashboard-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className="scale-in stat-card"
            style={{
              background: `radial-gradient(circle at top right, ${stat.color}08 0%, #0a0a0a 50%)`,
              border: `2px solid ${stat.color}30`,
              borderRadius: "20px",
              padding: "28px",
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              animationDelay: `${idx * 0.1}s`,
              boxShadow: `0 4px 20px ${stat.glow}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `radial-gradient(circle at top right, ${stat.color}15 0%, ${stat.color}05 50%)`;
              e.currentTarget.style.borderColor = stat.color;
              e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
              e.currentTarget.style.boxShadow = `0 12px 40px ${stat.glow}, 0 0 60px ${stat.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `radial-gradient(circle at top right, ${stat.color}08 0%, #0a0a0a 50%)`;
              e.currentTarget.style.borderColor = `${stat.color}30`;
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${stat.glow}`;
            }}
          >
            {/* Animated gradient orb */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                background: `radial-gradient(circle, ${stat.color}25 0%, transparent 70%)`,
                pointerEvents: "none",
                filter: "blur(20px)",
                animation: "pulse 3s ease-in-out infinite",
              }}
            ></div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <span
                className="material-icons"
                style={{ fontSize: "32px", color: stat.color }}
              >
                {stat.icon}
              </span>
              <div
                style={{
                  fontSize: "11px",
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                }}
              >
                {stat.unit}
              </div>
            </div>

            <div
              className="stat-value"
              style={{
                fontFamily: "Bebas Neue, Impact, sans-serif",
                fontSize: "52px",
                fontWeight: 700,
                color: stat.color,
                marginBottom: "8px",
                letterSpacing: "0.02em",
                lineHeight: "1",
                textShadow: `0 0 30px ${stat.glow}, 0 0 10px ${stat.color}50`,
              }}
            >
              {stat.value}
            </div>

            <div
              style={{
                fontSize: "14px",
                color: "#999",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Panels */}
      <div
        className="dashboard-panels"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
        }}
      >
        <Panel title="Weekly Overview" icon="bar_chart">
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <span className="material-icons rotating" style={{ fontSize: "48px", marginBottom: "16px" }}>sync</span>
              <p>Loading...</p>
            </div>
          ) : weeklyStats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <span className="material-icons" style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>insights</span>
              <p>No activity data yet</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>Start logging exercises to see your progress</p>
            </div>
          ) : (
            <div style={{ padding: "10px 0" }}>
              {/* Chart */}
              <div style={{ display: "flex", alignItems: "end", gap: "8px", height: "180px", marginBottom: "20px" }}>
                {weeklyStats.map((stat, idx) => {
                  const maxCalories = Math.max(...weeklyStats.map(s => s.calories), 1);
                  const height = (stat.calories / maxCalories) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#667eea", fontWeight: 700, fontFamily: "Roboto Mono" }}>
                        {stat.calories > 0 ? Math.round(stat.calories) : ""}
                      </div>
                      <div style={{
                        width: "100%",
                        height: `${height}%`,
                        minHeight: stat.calories > 0 ? "8px" : "0px",
                        background: stat.calories > 0 ? "linear-gradient(180deg, #667eea 0%, #764ba2 100%)" : "#2a2a2a",
                        borderRadius: "6px 6px 0 0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        boxShadow: stat.calories > 0 ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none"
                      }}
                      onMouseEnter={(e) => {
                        if (stat.calories > 0) {
                          e.currentTarget.style.opacity = "0.8";
                          e.currentTarget.style.transform = "translateY(-4px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      ></div>
                      <div style={{ fontSize: "11px", color: "#666", fontWeight: 700 }}>{stat.day}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "12px", borderTop: "1px solid #2a2a2a" }}>
                <div style={{ textAlign: "center", padding: "12px", background: "rgba(102, 126, 234, 0.1)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#667eea", fontFamily: "Bebas Neue" }}>
                    {Math.round(weeklyStats.reduce((sum, s) => sum + s.calories, 0))}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>Total Calories</div>
                </div>
                <div style={{ textAlign: "center", padding: "12px", background: "rgba(245, 87, 108, 0.1)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#f5576c", fontFamily: "Bebas Neue" }}>
                    {weeklyStats.reduce((sum, s) => sum + s.workouts, 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>Total Workouts</div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Recent Activity" icon="history">
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#666",
              }}
            >
              <span
                className="material-icons rotating"
                style={{ fontSize: "48px", marginBottom: "16px" }}
              >
                sync
              </span>
              <p>Loading...</p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#666",
              }}
            >
              <span
                className="material-icons pulse"
                style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}
              >
                fitness_center
              </span>
              <p
                style={{ fontSize: "16px", marginBottom: "8px", color: "#999" }}
              >
                No recent workouts
              </p>
              <p style={{ fontSize: "13px", marginBottom: "24px" }}>
                Start tracking your exercises
              </p>
              <a
                href="/log"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                  padding: "14px 28px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(102, 126, 234, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  add_circle
                </span>
                Log Exercise
              </a>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {recentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="fade-in"
                  style={{
                    padding: "20px",
                    background:
                      "linear-gradient(90deg, #FFB6B908 0%, #0a0a0a 15%)",
                    borderRadius: "16px",
                    borderLeft: "4px solid #FFB6B9",
                    border: "1px solid #2a2a2a",
                    borderLeftWidth: "4px",
                    borderLeftColor: "#FFB6B9",
                    transition: "all 0.3s ease",
                    animationDelay: `${idx * 0.1}s`,
                    boxShadow: "0 2px 10px rgba(255, 182, 185, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg, #FFB6B920 0%, #FFB6B908 15%)";
                    e.currentTarget.style.borderLeftColor = "#FFB6B9";
                    e.currentTarget.style.transform = "translateX(8px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(255, 182, 185, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg, #FFB6B908 0%, #0a0a0a 15%)";
                    e.currentTarget.style.borderLeftColor = "#FFB6B9";
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 10px rgba(255, 182, 185, 0.1)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{ fontSize: "20px", color: "#FFB6B9" }}
                    >
                      fitness_center
                    </span>
                    {log.exerciseName}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#999",
                      fontFamily: "Roboto Mono, monospace",
                      paddingLeft: "30px",
                    }}
                  >
                    {log.reps === 0 && log.durationSeconds
                      ? `${log.sets} set${log.sets > 1 ? "s" : ""} × ${
                          log.durationSeconds
                        }s duration`
                      : `${log.sets} set${log.sets > 1 ? "s" : ""} × ${
                          log.reps
                        } reps @ ${log.weightKg}kg`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  const iconColors = {
    bar_chart: "#667eea",
    history: "#FFB6B9",
  };
  const iconColor = iconColors[icon] || "#FFD93D";

  return (
    <div
      className="scale-in"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        border: "2px solid #2a2a2a",
        borderRadius: "20px",
        padding: "28px",
        minHeight: "320px",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#3a3a3a";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2a2a";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
      }}
    >
      {/* Subtle gradient background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: `linear-gradient(180deg, ${iconColor}08 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      ></div>

      <h3
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
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
            fontSize: "28px",
            color: iconColor,
            textShadow: `0 0 20px ${iconColor}60`,
          }}
        >
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}
