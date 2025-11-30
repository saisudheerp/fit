import { useNavigate } from "react-router-dom";

const RoutineTypeSelection = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .routine-type-header h2 {
            font-size: 48px !important;
          }
          .routine-cards {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .routine-section {
            padding: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .routine-type-header h2 {
            font-size: 36px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="routine-type-header" style={{ marginBottom: "48px" }}>
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
          Back to Routine Hub
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
          CREATE ROUTINE
        </h2>
        <p style={{ color: "#999", fontSize: "16px", fontWeight: 500 }}>
          Choose how you want to build your workout routine
        </p>
      </div>

      {/* Single-Day Routines */}
      <div style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "#fff",
            fontFamily: "Bebas Neue",
            letterSpacing: "0.05em",
          }}
        >
          A) SINGLE-DAY ROUTINES
        </h3>
        <p style={{ color: "#999", fontSize: "14px", marginBottom: "24px" }}>
          These routines have only one day. Always perform the same workout.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Predefined Single-Day */}
          <div
            onClick={() => navigate("/create-routine/predefined-single")}
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "32px 24px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(102, 126, 234, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
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
              <span
                className="material-icons"
                style={{ fontSize: "32px", color: "#667eea" }}
              >
                view_module
              </span>
              <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                Predefined Routine
              </h4>
            </div>
            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.6" }}>
              Choose from ready-made workouts: Full Body, Push, Pull, Legs,
              Chest Day, Shoulder Day, etc.
            </p>
          </div>

          {/* Custom Single-Day */}
          <div
            onClick={() => navigate("/create-routine/custom-single")}
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "32px 24px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#764ba2";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(118, 75, 162, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
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
              <span
                className="material-icons"
                style={{ fontSize: "32px", color: "#764ba2" }}
              >
                add_circle
              </span>
              <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                Custom Single Routine
              </h4>
            </div>
            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.6" }}>
              Create your own 1-day workout. Add exercises manually and
              customize sets, reps, and rest times.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Day Routines */}
      <div>
        <h3
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "16px",
            color: "#fff",
            fontFamily: "Bebas Neue",
            letterSpacing: "0.05em",
          }}
        >
          B) MULTI-DAY ROUTINES
        </h3>
        <p style={{ color: "#999", fontSize: "14px", marginBottom: "24px" }}>
          These routines have multiple days (2-6). Progress through days, then
          restart from Day 1.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Auto Routine Builder */}
          <div
            onClick={() => navigate("/builder")}
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "32px 24px",
              cursor: "pointer",
              transition: "all 0.3s ease",
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
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <span
                className="material-icons"
                style={{ fontSize: "32px", color: "#4ECDC4" }}
              >
                psychology
              </span>
              <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                Auto Routine Builder (AI)
              </h4>
            </div>
            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.6" }}>
              AI generates multi-day routines based on your goal, experience,
              equipment, and schedule. 2-6 days.
            </p>
          </div>

          {/* Custom Day-Split */}
          <div
            onClick={() => navigate("/custom-builder")}
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "32px 24px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#44A08D";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(68, 160, 141, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
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
              <span
                className="material-icons"
                style={{ fontSize: "32px", color: "#44A08D" }}
              >
                edit_calendar
              </span>
              <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                Custom Day-Split Routine
              </h4>
            </div>
            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.6" }}>
              Create your own multi-day plan. Choose 2-6 day split, then
              manually add exercises for each day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineTypeSelection;
