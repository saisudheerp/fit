import { useState, useEffect } from "react";
import { signIn, signUp, signInWithGoogle } from "../lib/firebase-auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Auth() {
  const { user, profile, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (!profile?.name || !profile?.body_weight_kg) {
        navigate("/setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, profile, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "An error occurred with Google sign in");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .auth-container {
          animation: slideUp 0.6s ease-out;
        }
        .auth-input:focus {
          border-color: #444 !important;
          background: #1a1a1a !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05) !important;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.15);
        }
        .google-btn:hover:not(:disabled) {
          background: #f5f5f5 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.2);
        }
        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px !important;
            margin: 0 8px;
          }
          .auth-title {
            font-size: 32px !important;
          }
        }
      `}</style>

      {/* Animated gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(60, 60, 60, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(40, 40, 40, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(30, 30, 30, 0.1) 0%, transparent 70%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "15%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse-glow 8s ease-in-out infinite",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "pulse-glow 10s ease-in-out infinite 2s",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />

      <div
        className="auth-container auth-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          background:
            "linear-gradient(145deg, rgba(25,25,25,0.9) 0%, rgba(15,15,15,0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "48px 40px",
          position: "relative",
          boxShadow: `
            0 25px 50px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 1px 0 rgba(255,255,255,0.1) inset
          `,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            animation: "borderGlow 3s ease-in-out infinite",
          }}
        />

        {/* Logo & Branding */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 28px",
              background: "linear-gradient(145deg, #fff 0%, #e8e8e8 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `
                0 20px 40px rgba(0,0,0,0.3),
                0 0 60px rgba(255,255,255,0.1),
                0 2px 0 rgba(255,255,255,0.2) inset
              `,
              position: "relative",
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: "40px", color: "#111" }}
            >
              fitness_center
            </span>
          </div>
          <h1
            className="auth-title"
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: "38px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: "12px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {isSignUp ? "Join Next Rep" : "Welcome back"}
          </h1>
          <p
            style={{
              color: "#888",
              fontSize: "15px",
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            {isSignUp
              ? "Start your transformation today"
              : "Continue your fitness journey"}
          </p>
        </div>

        {/* Google Sign In - Primary CTA */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          disabled={loading}
          className="google-btn"
          style={{
            width: "100%",
            padding: "16px 24px",
            background: "linear-gradient(145deg, #fff 0%, #f0f0f0 100%)",
            color: "#111",
            border: "none",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 15px rgba(255,255,255,0.1)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            margin: "32px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
          <span
            style={{
              color: "#666",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
        </div>

        {/* Email Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="auth-input"
              style={{
                width: "100%",
                padding: "16px 20px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Password"
              className="auth-input"
              style={{
                width: "100%",
                padding: "16px 20px",
                paddingRight: "54px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#888")}
              onMouseLeave={(e) => (e.target.style.color = "#555")}
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(255, 77, 77, 0.1)",
                border: "1px solid rgba(255, 77, 77, 0.3)",
                borderRadius: "12px",
                color: "#ff6b6b",
                fontSize: "13px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>
                error_outline
              </span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
            style={{
              width: "100%",
              padding: "16px",
              background: loading
                ? "#333"
                : "linear-gradient(145deg, #fff 0%, #e8e8e8 100%)",
              color: loading ? "#888" : "#111",
              border: "none",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              marginTop: "8px",
              boxShadow: loading ? "none" : "0 4px 15px rgba(255,255,255,0.1)",
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: "18px",
                    animation: "spin 1s linear infinite",
                  }}
                >
                  sync
                </span>
                Please wait...
              </span>
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div
          style={{
            textAlign: "center",
            marginTop: "32px",
            padding: "20px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.03)",
          }}
        >
          <p style={{ color: "#777", fontSize: "14px", margin: 0 }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                textDecoration: "none",
                borderBottom: "2px solid rgba(255,255,255,0.3)",
                paddingBottom: "2px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.borderBottomColor = "#fff")}
              onMouseLeave={(e) =>
                (e.target.style.borderBottomColor = "rgba(255,255,255,0.3)")
              }
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#555",
            fontSize: "11px",
            letterSpacing: "0.02em",
          }}
        >
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
