import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import Connect from "./pages/Connect";
import Dashboard from "./pages/Dashboard";
import Repos from "./pages/Repos";
import Drafts from "./pages/Drafts";
import VideoExport from "./pages/VideoExport";
import api, { withAuth } from "./services/api";

function PrivateRoute({ auth, children }) {
  if (!auth) return <Navigate to="/connect" replace />;
  return children;
}

/** Depolanan auth değerinden gösterilecek display adını türet */
function displayName(auth) {
  if (!auth) return "";
  const match = auth.match(/github\.com\/([a-zA-Z0-9_\-]+)/);
  if (match) return match[1];
  if (auth.startsWith("ghp_") || auth.startsWith("github_pat_")) return "🔐 Token ile bağlı";
  return auth;
}

export default function App() {
  // "auth" artık username, URL veya token tutabilir
  const [auth, setAuth] = useState(() => localStorage.getItem("github_auth") || "");
  const [drafts, setDrafts] = useState([]);
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    if (auth) {
      localStorage.setItem("github_auth", auth);
      // profil avatarını çek
      api.get("/repos/profile", withAuth(auth))
        .then((res) => setUserAvatar(res.data?.avatar_url || ""))
        .catch(() => setUserAvatar(""));
    } else {
      localStorage.removeItem("github_auth");
      setUserAvatar("");
    }
  }, [auth]);

  useEffect(() => {
    api.get("/drafts")
      .then((res) => setDrafts(res.data))
      .catch(() => setDrafts([]));
  }, []);

  const name = displayName(auth);

  return (
    <div className="app-shell">
      {auth && (
        <header className="topbar">
          <NavLink to="/dashboard" className="logo">
            <span className="logo-icon">✦</span>
            DevCanvas
          </NavLink>
          <nav>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-active" : ""}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/repos" className={({ isActive }) => isActive ? "nav-active" : ""}>
              📁 Repos
            </NavLink>
            <NavLink to="/drafts" className={({ isActive }) => isActive ? "nav-active" : ""}>
              📝 Drafts
            </NavLink>
            <NavLink to="/export" className={({ isActive }) => isActive ? "nav-active" : ""}>
              🎬 Export
            </NavLink>
          </nav>
          {/* User info + disconnect */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginLeft: "auto" }}>
            {userAvatar && (
              <img
                src={userAvatar}
                alt={name}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border-hover)" }}
              />
            )}
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>{name}</span>
            <button className="btn-disconnect" onClick={() => setAuth("")}>
              ⏻ Çıkış
            </button>
          </div>
        </header>
      )}
      <main className="content">
        <Routes>
          <Route path="/connect" element={<Connect setToken={setAuth} />} />
          <Route path="/dashboard" element={<PrivateRoute auth={auth}><Dashboard token={auth} /></PrivateRoute>} />
          <Route path="/repos" element={<PrivateRoute auth={auth}><Repos token={auth} /></PrivateRoute>} />
          <Route path="/drafts" element={<PrivateRoute auth={auth}><Drafts drafts={drafts} setDrafts={setDrafts} /></PrivateRoute>} />
          <Route path="/export" element={<PrivateRoute auth={auth}><VideoExport token={auth} /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={auth ? "/dashboard" : "/connect"} replace />} />
        </Routes>
      </main>
    </div>
  );
}
