import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import nextRepLogo from "../assets/nextrep.svg";

// Import muscle images
import chestImg from "../assets/chest.png";
import backImg from "../assets/back.png";
import shoulderImg from "../assets/shoulder.png";
import bicepsImg from "../assets/biceps.png";
import tricepsImg from "../assets/triceps.png";
import absImg from "../assets/abs.png";
import quadsImg from "../assets/quads.png";
import hamstringsImg from "../assets/hamstrings.png";
import glutesImg from "../assets/glutes.png";
import calvesImg from "../assets/calves.png";
import forearmImg from "../assets/forearms.png";
import cardioImg from "../assets/cardio.png";

export default function Landing() {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    setLoaded(true);

    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -100px 0px" }
    );

    // Observe all sections with data-animate
    setTimeout(() => {
      document.querySelectorAll("[data-animate]").forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  const muscleImages = [
    { img: chestImg, name: "Chest", intensity: 0.9 },
    { img: backImg, name: "Back", intensity: 0.7 },
    { img: shoulderImg, name: "Shoulders", intensity: 0.8 },
    { img: bicepsImg, name: "Biceps", intensity: 0.5 },
    { img: tricepsImg, name: "Triceps", intensity: 0.6 },
    { img: absImg, name: "Core", intensity: 0.4 },
  ];

  const features = [
    {
      icon: "fitness_center",
      title: "Intelligent Workout Logging",
      description:
        "Effortlessly capture every rep, set, and weight with precision. Our smart system adapts to strength training, bodyweight movements, timed holds, and heart-pumping cardio sessions.",
      gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
      color: "#f43f5e",
      align: "left",
    },
    {
      icon: "insights",
      title: "Smart Progress Analytics",
      description:
        "Track your journey with beautiful charts and insights. Monitor volume trends, strength gains, and workout consistency over time to optimize your training.",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      color: "#8b5cf6",
      align: "right",
    },
    {
      icon: "emoji_events",
      title: "Automatic PR Detection",
      description:
        "Never miss a milestone. Our intelligent system automatically tracks and celebrates when you crush new personal records for weight, reps, or total volume lifted.",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      color: "#fbbf24",
      align: "left",
    },
    {
      icon: "event_note",
      title: "Custom Training Programs",
      description:
        "Architect your perfect routine or choose from expertly crafted templates. Create multi-day programs that evolve and adapt as you grow stronger.",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#3b82f6",
      align: "right",
    },
    {
      icon: "whatshot",
      title: "Visual Muscle Mapping",
      description:
        "See your training balance at a glance with stunning heatmaps. Instantly identify which muscle groups you've worked and spot any imbalances in your routine.",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#10b981",
      align: "left",
    },
    {
      icon: "local_fire_department",
      title: "Precision Calorie Metrics",
      description:
        "Know exactly what you burn with science-backed MET calculations. Accurate calorie estimates for every exercise type help you fuel your transformation.",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      color: "#ec4899",
      align: "right",
    },
  ];

  const stats = [
    { value: "100+", label: "Exercises", icon: "fitness_center" },
    { value: "12", label: "Muscle Groups", icon: "accessibility_new" },
    { value: "4", label: "Workout Types", icon: "category" },
    { value: "∞", label: "Possibilities", icon: "all_inclusive" },
  ];

  const workoutTypes = [
    { name: "Strength", icon: "fitness_center", desc: "Weights & machines" },
    { name: "Bodyweight", icon: "self_improvement", desc: "Zero equipment" },
    { name: "Timed", icon: "timer", desc: "Holds & planks" },
    { name: "Cardio", icon: "directions_run", desc: "Heart pumping" },
  ];

  const muscleGroups = [
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Forearms",
    "Quads",
    "Hamstrings",
    "Glutes",
    "Calves",
    "Core",
    "Cardio",
  ];

  const getAnimationStyle = (id, direction = "up") => {
    const isVisible = visibleSections[id];
    const transforms = {
      up: "translateY(60px)",
      left: "translateX(-60px)",
      right: "translateX(60px)",
      scale: "scale(0.9)",
    };
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? "translateY(0) translateX(0) scale(1)"
        : transforms[direction],
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-2deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes rotateGlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(244, 63, 94, 0.2); }
          50% { border-color: rgba(244, 63, 94, 0.5); }
        }

        @keyframes barGrow {
          0%, 100% { width: 30%; }
          50% { width: 90%; }
        }

        @keyframes barGrow2 {
          0%, 100% { width: 50%; }
          50% { width: 70%; }
        }

        @keyframes barGrow3 {
          0%, 100% { width: 70%; }
          50% { width: 45%; }
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(3deg); }
          75% { transform: translateY(4px) rotate(-2deg); }
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes countUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes progressPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes orbitMove {
          from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
        }

        @keyframes lineFlow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-8px);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.45);
        }
        
        .glow-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        
        .glow-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .glow-btn:hover::before {
          left: 100%;
        }
        
        .glow-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(244, 63, 94, 0.4);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #f43f5e 50%, #8b5cf6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 4s ease infinite;
        }

        .feature-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-card:hover {
          transform: translateY(-12px) scale(1.02);
        }

        .feature-card:hover .feature-icon-box {
          transform: scale(1.1) rotate(5deg);
        }

        .feature-card:hover .feature-glow {
          opacity: 1;
        }

        .muscle-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .muscle-card:hover {
          transform: scale(1.08) translateY(-8px);
          z-index: 10;
        }
        
        .scroll-indicator {
          animation: float 2s ease-in-out infinite;
        }

        .phone-glow {
          animation: borderGlow 3s ease-in-out infinite;
        }
        
        @media (max-width: 1024px) {
          .hero-grid {
            flex-direction: column !important;
            padding: 120px 24px 60px !important;
            text-align: center;
          }
          
          .hero-content {
            max-width: 100% !important;
          }
          
          .hero-visual {
            margin-top: 60px;
            transform: scale(0.85);
          }

          .feature-row {
            flex-direction: column !important;
          }

          .feature-row.reverse {
            flex-direction: column !important;
          }

          .feature-content {
            max-width: 100% !important;
            text-align: center !important;
          }

          .feature-visual {
            justify-content: center !important;
            width: 100% !important;
          }
        }
        
        @media (max-width: 768px) {
          header {
            padding: 12px 16px !important;
          }

          header img {
            height: 32px !important;
          }

          header a, header .glow-btn {
            padding: 8px 16px !important;
            font-size: 13px !important;
          }

          .hero-grid {
            padding: 80px 16px 40px !important;
            min-height: auto !important;
          }

          .hero-title {
            font-size: 42px !important;
            margin-bottom: 16px !important;
            line-height: 1.2 !important;
          }

          .hero-content p {
            font-size: 15px !important;
            line-height: 1.6 !important;
            margin-bottom: 24px !important;
          }

          .hero-content > div:first-of-type {
            padding: 8px 16px !important;
            margin-bottom: 20px !important;
            font-size: 11px !important;
          }

          .hero-content > div {
            justify-content: center !important;
          }

          .hero-content a {
            padding: 14px 24px !important;
            font-size: 14px !important;
          }

          .stats-grid,
          div.stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 0 !important;
          }
          
          div[class="stats-grid"],
          div[class="stats-grid"][style] {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .stats-grid > div {
            padding: 14px 8px !important;
          }

          .stats-grid .material-icons {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }

          .stats-grid > div > div:nth-child(2) {
            font-size: 20px !important;
            margin-bottom: 2px !important;
          }

          .stats-grid > div > div:nth-child(3) {
            font-size: 10px !important;
          }
          
          h2.section-title {
            font-size: 36px !important;
            line-height: 1.2 !important;
          }
          
          .workout-types-grid,
          div.workout-types-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          
          div[class="workout-types-grid"],
          div[class="workout-types-grid"][style] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          div[class="workout-types-grid"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .workout-types-grid .glass-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }

          .workout-types-grid .glass-card > div {
            width: 48px !important;
            height: 48px !important;
            margin-bottom: 12px !important;
          }

          .workout-types-grid .material-icons {
            font-size: 24px !important;
          }

          .workout-types-grid h3 {
            font-size: 16px !important;
            margin-bottom: 4px !important;
          }

          .workout-types-grid p {
            font-size: 12px !important;
          }

          .muscle-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          #cta-section {
            display: block !important;
            padding: 60px 16px !important;
          }

          #cta-section > div {
            display: block !important;
            padding: 40px 20px !important;
            border-radius: 20px !important;
            max-width: 100% !important;
          }

          #cta-section > div > div > .material-icons {
            font-size: 40px !important;
            margin-bottom: 16px !important;
          }

          #cta-section > div > div > h2 {
            font-size: 28px !important;
            margin-bottom: 12px !important;
          }

          #cta-section > div > div > p {
            font-size: 15px !important;
            margin-bottom: 28px !important;
          }

          #cta-section > div > div > a {
            padding: 14px 28px !important;
            font-size: 15px !important;
          }
          
          #features {
            padding: 40px 16px !important;
          }

          #features-header {
            margin-bottom: 60px !important;
          }

          #features-header .section-title {
            font-size: 36px !important;
            line-height: 1.2 !important;
            margin-bottom: 12px !important;
          }

          #features-header h2 {
            font-size: 36px !important;
            line-height: 1.3 !important;
          }

          #features-header p {
            font-size: 14px !important;
          }

          .feature-row {
            gap: 30px !important;
            margin-bottom: 60px !important;
          }

          .feature-icon-box {
            width: 50px !important;
            height: 50px !important;
            margin-bottom: 16px !important;
            border-radius: 16px !important;
          }

          .feature-icon-box .material-icons {
            font-size: 24px !important;
          }

          .feature-content h3 {
            font-size: 22px !important;
            margin-bottom: 12px !important;
            line-height: 1.2 !important;
          }

          .feature-content p {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }

          .feature-card {
            height: auto !important;
            min-height: 240px !important;
            padding: 16px !important;
            border-radius: 16px !important;
          }

          .hero-content {
            max-width: 100% !important;
            padding: 0 !important;
          }

          .hero-visual {
            margin-top: 32px !important;
            transform: scale(0.9) !important;
            width: 100% !important;
          }

          .phone-glow {
            width: 100% !important;
            max-width: 260px !important;
            height: 540px !important;
            border-radius: 36px !important;
            padding: 10px !important;
          }

          .scroll-indicator {
            bottom: 20px !important;
            font-size: 11px !important;
          }

          /* Phone mockup internal content scaling */
          .phone-glow .material-icons {
            font-size: 18px !important;
          }

          /* Muscle heatmap mobile optimization */
          .muscle-heatmap-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }

          .muscle-heatmap-grid > div {
            border-radius: 8px !important;
          }

          .muscle-heatmap-grid > div > span {
            font-size: 8px !important;
          }
        }
      `}</style>

      {/* Animated Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "10%",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
            animation: "pulse 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "5%",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
            animation: "pulse 8s ease-in-out infinite 2s",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "30%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
            animation: "pulse 7s ease-in-out infinite 1s",
          }}
        />

        {/* Noise Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
            opacity: 0.07,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        {/* Grid Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            opacity: 0.5,
          }}
        />

        {/* Mouse Follow Glow */}
        <div
          style={{
            position: "absolute",
            left: mousePos.x - 200,
            top: mousePos.y - 200,
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            transition: "left 0.3s ease, top 0.3s ease",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrollY > 50 ? "rgba(5, 5, 5, 0.9)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          borderBottom:
            scrollY > 50 ? "1px solid rgba(255,255,255,0.05)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={nextRepLogo}
            alt="Next Rep"
            style={{
              height: "28px",
              width: "auto",
              filter: "invert(1)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="#features"
            style={{
              padding: "10px 20px",
              color: "#888",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
          >
            Features
          </a>
          <Link
            to="/auth"
            className="glow-btn"
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="hero-grid"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "120px 40px 60px",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="hero-content"
          style={{
            flex: 1,
            maxWidth: "650px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              borderRadius: "100px",
              marginBottom: "32px",
              animation: loaded ? "slideIn 0.6s ease 0.1s both" : "none",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                background: "#f43f5e",
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "#f43f5e",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              SMART FITNESS TRACKING
            </span>
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: "clamp(32px, 6vw, 68px)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: "24px",
              letterSpacing: "-0.03em",
              textShadow: "0 0 40px rgba(255,255,255,0.1)",
              animation: loaded ? "slideUp 0.8s ease 0.2s both" : "none",
            }}
          >
            Track. Train. <span className="text-gradient">Transform.</span>
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#888",
              lineHeight: 1.7,
              marginBottom: "32px",
              animation: loaded ? "slideUp 0.8s ease 0.3s both" : "none",
            }}
          >
            Your intelligent fitness companion with{" "}
            <strong style={{ color: "#fff" }}>100+ exercises</strong>,{" "}
            <strong style={{ color: "#fff" }}>AI coaching</strong>, automatic PR
            tracking, and beautiful muscle heatmaps. Everything you need to
            crush your goals.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "48px",
              animation: loaded ? "slideUp 0.8s ease 0.4s both" : "none",
            }}
          >
            <Link
              to="/auth"
              className="glow-btn"
              style={{
                padding: "18px 36px",
                background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                borderRadius: "16px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              Start Free
              <span className="material-icons" style={{ fontSize: "20px" }}>
                arrow_forward
              </span>
            </Link>
            <a
              href="#features"
              style={{
                padding: "18px 36px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              <span className="material-icons" style={{ fontSize: "20px" }}>
                play_circle
              </span>
              Explore
            </a>
          </div>

          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: "16px",
              animation: loaded ? "fadeIn 1s ease 0.6s both" : "none",
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "20px 12px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: "20px",
                    color: "#f43f5e",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  {stat.icon}
                </span>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual - Phone with Muscle Heatmap */}
        <div
          className="hero-visual"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            animation: loaded ? "scaleIn 1s ease 0.4s both" : "none",
          }}
        >
          {/* Rotating rings */}
          <div
            style={{
              position: "absolute",
              width: "380px",
              height: "380px",
              borderRadius: "50%",
              border: "1px dashed rgba(244, 63, 94, 0.2)",
              animation: "rotateGlow 30s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              border: "1px dashed rgba(139, 92, 246, 0.15)",
              animation: "rotateGlow 25s linear infinite reverse",
            }}
          />

          {/* Phone Mockup */}
          <div
            className="phone-glow"
            style={{
              width: "100%",
              maxWidth: "300px",
              height: "620px",
              background: "linear-gradient(180deg, #151515 0%, #0a0a0a 100%)",
              borderRadius: "44px",
              border: "2px solid rgba(244, 63, 94, 0.2)",
              padding: "12px",
              boxShadow:
                "0 50px 100px rgba(0,0,0,0.5), 0 0 80px rgba(244, 63, 94, 0.1)",
              animation: "float 6s ease-in-out infinite",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "100px",
                height: "28px",
                background: "#000",
                borderRadius: "20px",
                zIndex: 10,
              }}
            />

            {/* Phone Screen */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#0a0a0a",
                borderRadius: "36px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "48px 20px 16px",
                  background:
                    "linear-gradient(180deg, rgba(244, 63, 94, 0.1) 0%, transparent 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <img
                    src={nextRepLogo}
                    alt="Logo"
                    style={{ height: "18px", filter: "invert(1)" }}
                  />
                </div>
                <div
                  style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}
                >
                  Today's Progress
                </div>
                <div
                  style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}
                >
                  Keep crushing it! 💪
                </div>
              </div>

              {/* Stats Cards */}
              <div
                style={{
                  padding: "0 16px",
                  display: "flex",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "rgba(244, 63, 94, 0.1)",
                    borderRadius: "14px",
                    padding: "14px",
                    border: "1px solid rgba(244, 63, 94, 0.15)",
                  }}
                >
                  <div
                    style={{
                      color: "#f43f5e",
                      fontSize: "10px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    CALORIES
                  </div>
                  <div
                    style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}
                  >
                    1,847
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(139, 92, 246, 0.1)",
                    borderRadius: "14px",
                    padding: "14px",
                    border: "1px solid rgba(139, 92, 246, 0.15)",
                  }}
                >
                  <div
                    style={{
                      color: "#8b5cf6",
                      fontSize: "10px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    WORKOUTS
                  </div>
                  <div
                    style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}
                  >
                    3
                  </div>
                </div>
              </div>

              {/* Today's Routine */}
              <div style={{ padding: "0 16px", marginBottom: "14px" }}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
                    borderRadius: "16px",
                    padding: "16px",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#10b981",
                          fontSize: "10px",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        TODAY'S ROUTINE
                      </div>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: "16px",
                          fontWeight: 600,
                        }}
                      >
                        Push Day 💪
                      </div>
                      <div
                        style={{
                          color: "#888",
                          fontSize: "11px",
                          marginTop: "4px",
                        }}
                      >
                        Chest, Shoulders, Triceps
                      </div>
                    </div>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "#10b981",
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="material-icons"
                        style={{ color: "#fff", fontSize: "22px" }}
                      >
                        play_arrow
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Muscle Heatmap - Small Row */}
              <div style={{ padding: "0 16px", marginBottom: "14px" }}>
                <div
                  style={{
                    color: "#888",
                    fontSize: "11px",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  MUSCLE HEATMAP
                </div>
                <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                  {muscleImages.map((muscle, i) => (
                    <div
                      key={muscle.name}
                      style={{
                        minWidth: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        background: `rgba(244, 63, 94, ${
                          muscle.intensity * 0.35
                        })`,
                        border: `1px solid rgba(244, 63, 94, ${
                          muscle.intensity * 0.3
                        })`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={muscle.img}
                        alt={muscle.name}
                        style={{
                          width: "18px",
                          height: "18px",
                          objectFit: "contain",
                          filter: "brightness(0) invert(1)",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* PR Alert */}
              <div style={{ padding: "0 16px" }}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: "1px solid rgba(251, 191, 36, 0.2)",
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ color: "#fbbf24", fontSize: "24px" }}
                  >
                    emoji_events
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: "#fbbf24",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      NEW PERSONAL RECORD!
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      Bench Press: 100 kg × 5
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "5%",
              background: "rgba(244, 63, 94, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              animation: "floatReverse 5s ease-in-out infinite",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                className="material-icons"
                style={{ color: "#f43f5e", fontSize: "24px" }}
              >
                fitness_center
              </span>
              <div>
                <div
                  style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}
                >
                  100+ Exercises
                </div>
                <div style={{ color: "#888", fontSize: "11px" }}>
                  Full library
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "15%",
              left: "0%",
              background: "rgba(139, 92, 246, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              animation: "float 4s ease-in-out infinite 0.5s",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                className="material-icons"
                style={{ color: "#8b5cf6", fontSize: "24px" }}
              >
                emoji_events
              </span>
              <div>
                <div
                  style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}
                >
                  PR Tracking
                </div>
                <div style={{ color: "#888", fontSize: "11px" }}>
                  Auto detection
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <div
        className="scroll-indicator"
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: scrollY > 100 ? 0 : 1,
          transition: "opacity 0.3s ease",
          zIndex: 10,
        }}
      >
        <span style={{ color: "#666", fontSize: "12px" }}>
          Scroll to explore
        </span>
        <span
          className="material-icons"
          style={{ color: "#666", fontSize: "20px" }}
        >
          expand_more
        </span>
      </div>

      {/* Features Section - Left/Right Alternating */}
      <section
        id="features"
        style={{ padding: "80px 40px", position: "relative", zIndex: 10 }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Section Header */}
          <div
            id="features-header"
            data-animate
            style={{
              textAlign: "center",
              marginBottom: "100px",
              ...getAnimationStyle("features-header", "up"),
            }}
          >
            <span
              style={{
                color: "#8b5cf6",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                display: "inline-block",
                padding: "8px 20px",
                background: "rgba(139, 92, 246, 0.1)",
                borderRadius: "100px",
                marginBottom: "20px",
              }}
            >
              POWERFUL FEATURES
            </span>
            <h2
              className="section-title"
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "20px",
              }}
            >
              Everything You Need to
              <br />
              <span style={{ color: "#f43f5e" }}>Dominate</span> Your Fitness
            </h2>
            <p
              style={{
                color: "#666",
                fontSize: "18px",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Built for serious athletes and fitness enthusiasts. Smart features
              that actually help you progress.
            </p>
          </div>

          {/* Feature Rows */}
          {features.map((feature, i) => (
            <div
              key={i}
              id={`feature-${i}`}
              data-animate
              className={`feature-row ${
                feature.align === "right" ? "reverse" : ""
              }`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "80px",
                marginBottom: i < features.length - 1 ? "120px" : "0",
                flexDirection:
                  feature.align === "right" ? "row-reverse" : "row",
                ...getAnimationStyle(
                  `feature-${i}`,
                  feature.align === "right" ? "right" : "left"
                ),
              }}
            >
              {/* Content */}
              <div
                className="feature-content"
                style={{
                  flex: 1,
                  textAlign: feature.align === "right" ? "right" : "left",
                }}
              >
                <div
                  className="feature-icon-box"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: feature.gradient,
                    borderRadius: "24px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "28px",
                    boxShadow: `0 20px 60px ${feature.color}40`,
                    transition: "transform 0.4s ease",
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ color: "#fff", fontSize: "40px" }}
                  >
                    {feature.icon}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "20px",
                    lineHeight: 1.2,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "#888",
                    fontSize: "17px",
                    lineHeight: 1.8,
                    maxWidth: "500px",
                    marginLeft: feature.align === "right" ? "auto" : "0",
                  }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Visual */}
              <div
                className="feature-visual"
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent:
                    feature.align === "right" ? "flex-start" : "flex-end",
                }}
              >
                <div
                  className="feature-card"
                  style={{
                    width: "100%",
                    maxWidth: "380px",
                    height: "320px",
                    background: `radial-gradient(circle at top right, ${feature.color}08 0%, #0a0a0a 50%)`,
                    borderRadius: "20px",
                    border: `2px solid ${feature.color}30`,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px",
                    boxShadow: `0 4px 20px ${feature.color}15`,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.transform =
                      "translateY(-6px) scale(1.02)";
                    e.currentTarget.style.boxShadow = `0 12px 40px ${feature.color}30, 0 0 60px ${feature.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${feature.color}30`;
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 20px ${feature.color}15`;
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
                      background: `radial-gradient(circle, ${feature.color}25 0%, transparent 70%)`,
                      pointerEvents: "none",
                      filter: "blur(20px)",
                      animation: "pulse 3s ease-in-out infinite",
                    }}
                  />

                  {/* Animated Content Based on Feature */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {/* Feature 0: Workout Logging - Animated rep counter */}
                    {i === 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          height: "100%",
                          justifyContent: "center",
                        }}
                      >
                        {[
                          {
                            name: "Bench Press",
                            sets: "4×12",
                            weight: "80 kg",
                          },
                          {
                            name: "Shoulder Press",
                            sets: "3×10",
                            weight: "40 kg",
                          },
                          { name: "Incline DB", sets: "3×12", weight: "30 kg" },
                        ].map((ex, j) => (
                          <div
                            key={j}
                            style={{
                              background: `radial-gradient(circle at top right, ${feature.color}08 0%, #0a0a0a 80%)`,
                              borderRadius: "14px",
                              padding: "14px 18px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              border: `1px solid ${feature.color}20`,
                              animation: `slideUp 0.5s ease ${j * 0.1}s both`,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color: "#fff",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                {ex.name}
                              </div>
                              <div
                                style={{
                                  color: "#666",
                                  fontSize: "11px",
                                  marginTop: "2px",
                                }}
                              >
                                {ex.sets}
                              </div>
                            </div>
                            <div
                              style={{
                                background: `${feature.color}20`,
                                padding: "5px 12px",
                                borderRadius: "8px",
                                color: feature.color,
                                fontSize: "13px",
                                fontWeight: 700,
                                border: `1px solid ${feature.color}30`,
                              }}
                            >
                              {ex.weight}
                            </div>
                          </div>
                        ))}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            marginTop: "8px",
                            animation: "fadeIn 0.5s ease 0.4s both",
                          }}
                        >
                          {[
                            "strength",
                            "accessibility_new",
                            "timer",
                            "directions_run",
                          ].map((icon, j) => (
                            <div
                              key={j}
                              style={{
                                width: "36px",
                                height: "36px",
                                background:
                                  j === 0 ? `${feature.color}25` : "#1a1a1a",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border:
                                  j === 0
                                    ? `1px solid ${feature.color}40`
                                    : "1px solid #2a2a2a",
                              }}
                            >
                              <span
                                className="material-icons"
                                style={{
                                  fontSize: "18px",
                                  color: j === 0 ? feature.color : "#555",
                                }}
                              >
                                {icon === "strength" ? "fitness_center" : icon}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feature 1: Progress Analytics - Animated chart */}
                    {i === 1 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            color: feature.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            marginBottom: "16px",
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          VOLUME PROGRESSION
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            gap: "10px",
                            height: "140px",
                            padding: "0 8px",
                          }}
                        >
                          {[45, 60, 55, 75, 70, 90, 85].map((h, j) => (
                            <div
                              key={j}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: `${h * 1.4}px`,
                                  background: `linear-gradient(180deg, ${feature.color} 0%, ${feature.color}40 100%)`,
                                  borderRadius: "6px 6px 3px 3px",
                                  animation: `scaleIn 0.4s ease ${
                                    j * 0.08
                                  }s both`,
                                  transformOrigin: "bottom",
                                  boxShadow: `0 4px 12px ${feature.color}30`,
                                }}
                              />
                              <span
                                style={{
                                  color: "#555",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                }}
                              >
                                {["M", "T", "W", "T", "F", "S", "S"][j]}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "20px",
                            marginTop: "20px",
                            animation: "fadeIn 0.5s ease 0.6s both",
                          }}
                        >
                          <div
                            style={{
                              textAlign: "center",
                              background: `${feature.color}15`,
                              padding: "10px 16px",
                              borderRadius: "10px",
                              border: `1px solid ${feature.color}25`,
                            }}
                          >
                            <div
                              style={{
                                color: feature.color,
                                fontSize: "18px",
                                fontWeight: 700,
                              }}
                            >
                              +23%
                            </div>
                            <div
                              style={{
                                color: "#666",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              This Week
                            </div>
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              background: "rgba(16, 185, 129, 0.15)",
                              padding: "10px 16px",
                              borderRadius: "10px",
                              border: "1px solid rgba(16, 185, 129, 0.25)",
                            }}
                          >
                            <div
                              style={{
                                color: "#10b981",
                                fontSize: "18px",
                                fontWeight: 700,
                              }}
                            >
                              ↑
                            </div>
                            <div
                              style={{
                                color: "#666",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              Trending
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feature 2: PR Detection - Trophy animation */}
                    {i === 2 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{ position: "relative", marginBottom: "20px" }}
                        >
                          <div
                            style={{
                              width: "90px",
                              height: "90px",
                              background: feature.gradient,
                              borderRadius: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              animation: "iconFloat 3s ease-in-out infinite",
                              boxShadow: `0 16px 48px ${feature.color}50`,
                            }}
                          >
                            <span
                              className="material-icons"
                              style={{ fontSize: "48px", color: "#fff" }}
                            >
                              emoji_events
                            </span>
                          </div>
                          {/* Ripple effects */}
                          {[0, 1, 2].map((j) => (
                            <div
                              key={j}
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "90px",
                                height: "90px",
                                borderRadius: "24px",
                                border: `2px solid ${feature.color}`,
                                transform: "translate(-50%, -50%)",
                                animation: `ripple 2s ease-in-out ${
                                  j * 0.6
                                }s infinite`,
                              }}
                            />
                          ))}
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            animation: "slideUp 0.5s ease 0.3s both",
                          }}
                        >
                          <div
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            New Personal Record!
                          </div>
                          <div
                            style={{
                              color: feature.color,
                              fontSize: "22px",
                              fontWeight: 700,
                              textShadow: `0 0 20px ${feature.color}50`,
                            }}
                          >
                            Deadlift: 180 kg
                          </div>
                          <div
                            style={{
                              color: "#10b981",
                              fontSize: "12px",
                              marginTop: "6px",
                              fontWeight: 600,
                            }}
                          >
                            +5 kg from previous best
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feature 3: Custom Programs - Calendar view */}
                    {i === 3 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            color: feature.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            marginBottom: "12px",
                            textTransform: "uppercase",
                          }}
                        >
                          THIS WEEK'S PROGRAM
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {[
                            {
                              day: "MON",
                              name: "Push Day",
                              icon: "fitness_center",
                              active: true,
                            },
                            {
                              day: "TUE",
                              name: "Pull Day",
                              icon: "rowing",
                              active: false,
                            },
                            {
                              day: "WED",
                              name: "Rest",
                              icon: "spa",
                              active: false,
                            },
                            {
                              day: "THU",
                              name: "Legs",
                              icon: "directions_walk",
                              active: false,
                            },
                          ].map((d, j) => (
                            <div
                              key={j}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 14px",
                                background: d.active
                                  ? `radial-gradient(circle at left, ${feature.color}20 0%, ${feature.color}08 100%)`
                                  : "#0f0f0f",
                                borderRadius: "12px",
                                border: d.active
                                  ? `2px solid ${feature.color}40`
                                  : "1px solid #1a1a1a",
                                animation: `slideUp 0.4s ease ${j * 0.1}s both`,
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  color: d.active ? feature.color : "#555",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {d.day}
                              </div>
                              <span
                                className="material-icons"
                                style={{
                                  fontSize: "18px",
                                  color: d.active ? feature.color : "#444",
                                }}
                              >
                                {d.icon}
                              </span>
                              <div
                                style={{
                                  color: d.active ? "#fff" : "#666",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                              >
                                {d.name}
                              </div>
                              {d.active && (
                                <div style={{ marginLeft: "auto" }}>
                                  <span
                                    className="material-icons"
                                    style={{
                                      fontSize: "16px",
                                      color: feature.color,
                                    }}
                                  >
                                    check_circle
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feature 4: Muscle Mapping - Heatmap grid */}
                    {i === 4 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            color: feature.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            marginBottom: "14px",
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          WEEKLY TRAINING BALANCE
                        </div>
                        <div
                          className="muscle-heatmap-grid"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          {[
                            { name: "Chest", intensity: 0.9 },
                            { name: "Back", intensity: 0.7 },
                            { name: "Shoulders", intensity: 0.8 },
                            { name: "Arms", intensity: 0.5 },
                            { name: "Core", intensity: 0.4 },
                            { name: "Quads", intensity: 0.6 },
                            { name: "Hams", intensity: 0.3 },
                            { name: "Glutes", intensity: 0.5 },
                          ].map((m, j) => (
                            <div
                              key={j}
                              style={{
                                aspectRatio: "1",
                                borderRadius: "10px",
                                background: `radial-gradient(circle at center, ${
                                  feature.color
                                }${Math.round(m.intensity * 60)
                                  .toString(16)
                                  .padStart(2, "0")} 0%, ${
                                  feature.color
                                }${Math.round(m.intensity * 20)
                                  .toString(16)
                                  .padStart(2, "0")} 100%)`,
                                border: `1px solid ${feature.color}${Math.round(
                                  m.intensity * 40
                                )
                                  .toString(16)
                                  .padStart(2, "0")}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                animation: `scaleIn 0.3s ease ${
                                  j * 0.05
                                }s both`,
                                boxShadow:
                                  m.intensity > 0.7
                                    ? `0 4px 12px ${feature.color}30`
                                    : "none",
                              }}
                            >
                              <span
                                style={{
                                  color: "#fff",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  opacity: 0.9,
                                }}
                              >
                                {m.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "8px",
                              background: `linear-gradient(90deg, ${feature.color}15 0%, ${feature.color} 100%)`,
                              borderRadius: "4px",
                              border: `1px solid ${feature.color}30`,
                            }}
                          />
                          <span
                            style={{
                              color: "#555",
                              fontSize: "10px",
                              fontWeight: 600,
                            }}
                          >
                            Low → High
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Feature 5: Calorie Tracking - Animated meter */}
                    {i === 5 && (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "140px",
                            height: "140px",
                            marginBottom: "20px",
                          }}
                        >
                          {/* Background circle */}
                          <svg
                            width="140"
                            height="140"
                            style={{ position: "absolute", top: 0, left: 0 }}
                          >
                            <circle
                              cx="70"
                              cy="70"
                              r="60"
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth="10"
                            />
                            <circle
                              cx="70"
                              cy="70"
                              r="60"
                              fill="none"
                              stroke={feature.color}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray="377"
                              strokeDashoffset="94"
                              transform="rotate(-90 70 70)"
                              style={{
                                animation: "lineFlow 1.5s ease both",
                                filter: `drop-shadow(0 0 8px ${feature.color}50)`,
                              }}
                            />
                          </svg>
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                color: feature.color,
                                fontSize: "28px",
                                fontWeight: 700,
                                textShadow: `0 0 20px ${feature.color}40`,
                              }}
                            >
                              847
                            </div>
                            <div
                              style={{
                                color: "#666",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              KCAL
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            animation: "fadeIn 0.5s ease 0.5s both",
                          }}
                        >
                          {[
                            { label: "Active", value: "72 min" },
                            { label: "Exercises", value: "8" },
                          ].map((s, j) => (
                            <div
                              key={j}
                              style={{
                                textAlign: "center",
                                background: `${feature.color}15`,
                                padding: "10px 16px",
                                borderRadius: "10px",
                                border: `1px solid ${feature.color}25`,
                              }}
                            >
                              <div
                                style={{
                                  color: feature.color,
                                  fontSize: "16px",
                                  fontWeight: 700,
                                }}
                              >
                                {s.value}
                              </div>
                              <div
                                style={{
                                  color: "#666",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                }}
                              >
                                {s.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workout Types Section */}
      <section
        id="workout-types"
        data-animate
        style={{
          padding: "100px 40px",
          position: "relative",
          zIndex: 10,
          ...getAnimationStyle("workout-types", "up"),
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span
              style={{
                color: "#f43f5e",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                display: "inline-block",
                padding: "8px 20px",
                background: "rgba(244, 63, 94, 0.1)",
                borderRadius: "100px",
                marginBottom: "20px",
              }}
            >
              VERSATILE TRACKING
            </span>
            <h2
              className="section-title"
              style={{
                fontSize: "42px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "16px",
              }}
            >
              Every Workout Type Covered
            </h2>
            <p
              style={{
                color: "#666",
                fontSize: "16px",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              From heavy iron to pure cardio, we've got the perfect tracking
              system for every movement.
            </p>
          </div>

          <div
            className="workout-types-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: "20px",
            }}
          >
            {workoutTypes.map((type, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  borderRadius: "24px",
                  padding: "32px 24px",
                  textAlign: "center",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background:
                      "linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0.05) 100%)",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    transition: "all 0.4s ease",
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ color: "#f43f5e", fontSize: "32px" }}
                  >
                    {type.icon}
                  </span>
                </div>
                <h3
                  style={{
                    color: "#fff",
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  {type.name}
                </h3>
                <p style={{ color: "#666", fontSize: "14px" }}>{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Muscle Groups Section */}
      <section
        id="muscles"
        data-animate
        style={{
          padding: "80px 40px",
          position: "relative",
          zIndex: 10,
          ...getAnimationStyle("muscles", "up"),
        }}
      >
        <div
          style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}
        >
          <span
            style={{
              color: "#10b981",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              display: "inline-block",
              padding: "8px 20px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "100px",
              marginBottom: "20px",
            }}
          >
            COMPREHENSIVE COVERAGE
          </span>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "40px",
            }}
          >
            12 Muscle Groups Tracked
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {muscleGroups.map((muscle, i) => (
              <div
                key={muscle}
                style={{
                  padding: "14px 28px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "100px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "default",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.3)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {muscle}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta-section"
        data-animate
        style={{
          padding: isMobile ? "60px 24px" : "100px 40px",
          position: "relative",
          zIndex: 10,
          ...getAnimationStyle("cta", "scale"),
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
            padding: isMobile ? "48px 24px" : "80px 60px",
            background:
              "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
            borderRadius: isMobile ? "24px" : "40px",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "300px",
              height: "300px",
              background:
                "radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              left: "-100px",
              width: "300px",
              height: "300px",
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(40px)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span
              className="material-icons"
              style={{
                fontSize: "56px",
                color: "#f43f5e",
                marginBottom: "24px",
                display: "block",
              }}
            >
              rocket_launch
            </span>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "20px",
              }}
            >
              Ready to Transform?
            </h2>
            <p
              style={{
                color: "#888",
                fontSize: "18px",
                marginBottom: "40px",
                maxWidth: "500px",
                margin: "0 auto 40px",
                lineHeight: 1.7,
              }}
            >
              Join the Next Rep community and start your fitness transformation
              today. It's completely free to get started!
            </p>
            <Link
              to="/auth"
              className="glow-btn"
              style={{
                padding: "20px 48px",
                background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                borderRadius: "18px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              Get Started Free
              <span className="material-icons" style={{ fontSize: "22px" }}>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "60px 40px 40px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src={nextRepLogo}
              alt="Next Rep"
              style={{ height: "28px", filter: "invert(1)", opacity: 0.7 }}
            />
            <span style={{ color: "#666", fontSize: "14px" }}>
              © 2025 Next Rep. All rights reserved.
            </span>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <a
              href="#"
              style={{
                color: "#666",
                fontSize: "14px",
                textDecoration: "none",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              Privacy
            </a>
            <a
              href="#"
              style={{
                color: "#666",
                fontSize: "14px",
                textDecoration: "none",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              Terms
            </a>
            <a
              href="#"
              style={{
                color: "#666",
                fontSize: "14px",
                textDecoration: "none",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
