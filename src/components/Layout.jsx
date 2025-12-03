import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "../lib/firebase-auth";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/log", label: "Log", icon: "fitness_center" },
    { path: "/routines", label: "Routines", icon: "event_note" },
    { path: "/history", label: "History", icon: "history" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#121212",
      }}
    >
      <style>{`
        .desktop-nav { display: flex; }
        .desktop-signout { display: flex; }
        .mobile-menu-btn { display: none; }
        
        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .desktop-signout { display: none; }
          .mobile-menu-btn { display: block; }
          .header-logo h1 { font-size: 24px !important; }
          .header-logo .material-icons { font-size: 24px !important; }
          .footer-links { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          backgroundColor: "#000",
          borderBottom: "2px solid #1a1a1a",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "75px",
          }}
        >
          <Link
            to="/"
            className="header-logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #fff 0%, #999 100%)",
                borderRadius: "10px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-icons"
                style={{ fontSize: "28px", color: "#000" }}
              >
                fitness_center
              </span>
            </div>
            <h1
              style={{
                fontFamily: "Bebas Neue, Impact, sans-serif",
                fontSize: "32px",
                letterSpacing: "0.1em",
                background: "linear-gradient(135deg, #fff 0%, #999 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FITTRACK
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="desktop-nav"
            style={{
              gap: "8px",
              alignItems: "center",
              backgroundColor: "#0a0a0a",
              padding: "8px",
              borderRadius: "16px",
              border: "2px solid #1a1a1a",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: isActive(item.path)
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "transparent",
                  color: isActive(item.path) ? "#fff" : "#666",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                  transform: isActive(item.path) ? "scale(1)" : "scale(0.98)",
                  boxShadow: isActive(item.path)
                    ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#666";
                    e.currentTarget.style.transform = "scale(0.98)";
                  }
                }}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sign Out Button Desktop */}
          <button
            onClick={handleSignOut}
            className="desktop-signout"
            style={{
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "12px",
              background: "transparent",
              border: "2px solid #2a2a2a",
              color: "#999",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f5576c";
              e.currentTarget.style.background =
                "linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)";
              e.currentTarget.style.color = "#f5576c";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(245, 87, 108, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#999";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              logout
            </span>
            <span>Sign Out</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              padding: "8px",
              background: "transparent",
              border: "none",
              color: "#fff",
            }}
          >
            <span className="material-icons">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav
            style={{
              padding: "0 1.5rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 18px",
                  borderRadius: "8px",
                  backgroundColor: isActive(item.path)
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#1a1a1a",
                  color: isActive(item.path) ? "#fff" : "#999",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 18px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "#f5576c",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              <span className="material-icons">logout</span>
              <span>Sign Out</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#0a0a0a",
          borderTop: "1px solid #222",
          padding: "24px 0",
          marginTop: "auto",
        }}
      >
        <div
          className="footer-links"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#666",
              fontSize: "13px",
            }}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>
              fitness_center
            </span>
            <span>FitTrack © 2025</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <a
              href="#"
              style={{
                color: "#666",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              About
            </a>
            <a
              href="#"
              style={{
                color: "#666",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Privacy
            </a>
            <a
              href="https://github.com"
              style={{
                color: "#666",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
