import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ExerciseLog from "./pages/ExerciseLog";
import Routines from "./pages/Routines";
import RoutineTypeSelection from "./pages/RoutineTypeSelection";
import AutoRoutineBuilder from "./pages/AutoRoutineBuilder";
import CustomAutoRoutineBuilder from "./pages/CustomAutoRoutineBuilder";
import CustomSingleRoutine from "./pages/CustomSingleRoutine";
import PredefinedSingleRoutine from "./pages/PredefinedSingleRoutine";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";

function ProtectedRoute({ children, requireProfile = true }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#121212",
        }}
      >
        <div style={{ textAlign: "center", color: "#666" }}>
          <span
            className="material-icons"
            style={{ fontSize: "64px", marginBottom: "16px" }}
          >
            hourglass_empty
          </span>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Only redirect to setup if profile is required and incomplete
  if (
    requireProfile &&
    (!profile || !profile.name || !profile.body_weight_kg)
  ) {
    return <Navigate to="/setup" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/setup"
              element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExerciseLog />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routines />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-routine"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RoutineTypeSelection />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-routine/predefined-single"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PredefinedSingleRoutine />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-routine/custom-single"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CustomSingleRoutine />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AutoRoutineBuilder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-builder"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CustomAutoRoutineBuilder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Catch-all route - redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
export default App;
