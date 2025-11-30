import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const success = (message, duration) =>
    showToast(message, "success", duration);
  const error = (message, duration) => showToast(message, "error", duration);
  const info = (message, duration) => showToast(message, "info", duration);
  const warning = (message, duration) =>
    showToast(message, "warning", duration);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }) {
  const colors = {
    success: {
      background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
      shadow: "rgba(78, 205, 196, 0.4)",
      icon: "check_circle",
    },
    error: {
      background: "linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)",
      shadow: "rgba(255, 107, 107, 0.4)",
      icon: "error",
    },
    warning: {
      background: "linear-gradient(135deg, #FFD93D 0%, #F6C23E 100%)",
      shadow: "rgba(255, 217, 61, 0.4)",
      icon: "warning",
    },
    info: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      shadow: "rgba(102, 126, 234, 0.4)",
      icon: "info",
    },
  };

  const style = colors[toast.type] || colors.info;

  return (
    <div
      style={{
        background: style.background,
        color: "#fff",
        padding: "14px 20px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "14px",
        boxShadow: `0 4px 20px ${style.shadow}`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: "250px",
        maxWidth: "400px",
        pointerEvents: "auto",
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <span className="material-icons" style={{ fontSize: "20px" }}>
        {style.icon}
      </span>
      <span>{toast.message}</span>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
