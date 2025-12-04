import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createProfile } from "../lib/firebase-database";

export default function ProfileSetup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    bodyWeight: profile?.body_weight_kg || "",
    height: profile?.height_cm || "",
    age: profile?.age || "",
    gender: profile?.gender || "male",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect to dashboard if profile is already complete
  useEffect(() => {
    if (profile && profile.name && profile.body_weight_kg) {
      navigate("/");
    }
  }, [profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.bodyWeight || !formData.height) {
      setError(
        "Please fill in all required fields (Name, Body Weight, Height)"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const profileData = {
        name: formData.name,
        body_weight_kg: parseFloat(formData.bodyWeight),
        height_cm: parseFloat(formData.height),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
      };

      console.log("Saving profile for user:", user.uid);
      console.log("Profile data:", profileData);

      await createProfile(user.uid, profileData);

      console.log("Profile saved successfully!");
      alert("Profile saved! Redirecting...");

      // Force a full page reload to refresh auth context
      window.location.href = "/";
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .profile-setup-card {
            padding: 32px 24px !important;
          }
          .profile-setup-title {
            font-size: 40px !important;
          }
          .profile-setup-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .profile-setup-form input,
          .profile-setup-form select {
            font-size: 16px !important;
            padding: 14px 16px !important;
          }
          .profile-setup-form button {
            font-size: 15px !important;
            padding: 14px !important;
          }
        }
      `}</style>
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0) 70%)",
          borderRadius: "50%",
          animation: "pulse 4s ease-in-out infinite",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(240, 147, 251, 0.15) 0%, rgba(240, 147, 251, 0) 70%)",
          borderRadius: "50%",
          animation: "pulse 5s ease-in-out infinite",
        }}
      ></div>

      <div
        className="scale-in"
        style={{
          maxWidth: "540px",
          width: "100%",
          backgroundColor: "#1a1a1a",
          border: "2px solid #2a2a2a",
          borderRadius: "20px",
          padding: "48px",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background:
              "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            borderRadius: "20px 20px 0 0",
          }}
        ></div>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: "48px", color: "#fff" }}
            >
              person_add
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Bebas Neue, Impact, sans-serif",
              fontSize: "48px",
              letterSpacing: "0.1em",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "8px",
            }}
          >
            COMPLETE PROFILE
          </h1>
          <p style={{ color: "#999", fontSize: "15px", fontWeight: 500 }}>
            <span
              className="material-icons"
              style={{ fontSize: "20px", color: "#667eea" }}
            >
              info
            </span>
            We need some info to calculate accurate calories
          </p>
        </div>

        {error && (
          <div
            className="scale-in"
            style={{
              padding: "14px 16px",
              marginBottom: "24px",
              background:
                "linear-gradient(135deg, #ff6b6b20 0%, #ee5a5a20 100%)",
              border: "2px solid #ff6b6b",
              borderRadius: "12px",
              color: "#ff6b6b",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              error
            </span>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#999",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              NAME <span style={{ color: "#ff6b6b" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your name"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#999",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              BODY WEIGHT (KG) <span style={{ color: "#ff6b6b" }}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.bodyWeight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, bodyWeight: val });
                }
              }}
              placeholder="e.g., 75"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#999",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              HEIGHT (CM) <span style={{ color: "#ff6b6b" }}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.height}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setFormData({ ...formData, height: val });
                }
              }}
              placeholder="e.g., 175"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#999",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              AGE (OPTIONAL)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.age}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*$/.test(val)) {
                  setFormData({ ...formData, age: val });
                }
              }}
              placeholder="e.g., 25"
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#999",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              GENDER
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              style={{
                width: "100%",
                padding: "14px 16px",
                backgroundColor: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
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
              transition: "all 0.2s",
              marginTop: "8px",
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
            {saving ? "Saving..." : "✨ Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
