import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import AMDashboard from "./pages/AMDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import "./App.css";

function AppInner() {
  const { user, logout, loading } = useAuth();
  const [toast, setToast] = useState({ msg: "", show: false });

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" />
    </div>
  );

  if (!user) return null;

  const isManager = user.role === "Sb_Tracker_Manager";

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">SB</div>
          <div>
            <div className="topbar-title">
              {isManager ? "Manager Dashboard" : user.username}
            </div>
            <div className="topbar-sub">
              {isManager ? "SmartSoc Business — All teams" : "AM Dashboard"}
            </div>
          </div>
        </div>

        <button className="btn btn-sm btn-ghost" onClick={logout}>Sign out</button>
      </div>

      {isManager
        ? <ManagerDashboard onToast={showToast} />
        : <AMDashboard user={user} onToast={showToast} />
      }

      <div className={`toast ${toast.show ? "toast-show" : ""}`}>{toast.msg}</div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}