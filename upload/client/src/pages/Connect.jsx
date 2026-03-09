import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { withAuth } from "../services/api";

function detectType(value) {
  const v = value.trim();
  if (!v) return "empty";
  if (v.startsWith("ghp_") || v.startsWith("github_pat_") || v.startsWith("gho_")) return "token";
  if (v.includes("github.com/")) return "url";
  return "username";
}

function extractUsername(value) {
  const match = value.trim().replace(/\/$/, "").match(/github\.com\/([a-zA-Z0-9_\-]+)/);
  return match ? match[1] : value.trim();
}

const TYPE_INFO = {
  empty:    { icon: "🔗", label: "",                                    color: "var(--text-muted)" },
  username: { icon: "👤", label: "GitHub Kullanıcı Adı",                color: "#22d3ee" },
  url:      { icon: "🌐", label: "GitHub Profil URL",                   color: "#6366f1" },
  token:    { icon: "🔐", label: "Personal Access Token (tüm repolar)", color: "#f97316" },
};

export default function Connect({ setToken }) {
  const [input, setInput]       = useState("");
  const [boostToken, setBoost]  = useState("");
  const [showBoost, setShowBoost] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const type = detectType(input);
  const info = TYPE_INFO[type];
  const isUsernameMode = type === "username" || type === "url";

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");
    setLoading(true);

    let authValue;
    if (type === "token") authValue = input.trim();
    else if (boostToken.trim()) authValue = `${extractUsername(input)}::${boostToken.trim()}`;
    else authValue = extractUsername(input);

    try {
      await api.get("/repos", withAuth(authValue));
      setToken(authValue);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Bağlantı hatası.";
      if (err.response?.status === 404) {
        setError("❌ Kullanıcı bulunamadı.");
      } else if (err.response?.status === 403 || err.response?.status === 429) {
        setError("⏱ GitHub API limiti doldu! 10 dakikalık taze veri için aşağıdan PAT token ekleyebilirsin.");
        setShowBoost(true);
      } else if (err.response?.status === 401) {
        setError("❌ Token geçersiz.");
      } else {
        setError(`Bağlantı hatası: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect-page">
      <div className="connect-card">
        <div className="connect-brand">
          <div className="brand-icon">✦</div>
          <h1>DevCanvas</h1>
          <p>Kullanıcı adını, profil linkini veya PAT token'ını gir.</p>
        </div>

        <form onSubmit={submit} className="connect-form">
          <div className="form-field">
            <label htmlFor="auth-input">GitHub Kullanıcı Adı / Profil URL / Token</label>
            <input
              id="auth-input"
              type={type === "token" ? "password" : "text"}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              placeholder="mustafakemal0146  ·  github.com/kullanici  ·  ghp_xxx"
              required autoComplete="off" spellCheck={false}
            />
            {type !== "empty" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem", fontSize: "0.78rem", color: info.color }}>
                {info.icon} <strong>{info.label}</strong> olarak algılandı
                {type === "url" && (
                  <span style={{ color: "var(--text-muted)" }}>
                    — kullanıcı: <strong style={{ color: info.color }}>{extractUsername(input)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {isUsernameMode && (
            <div>
              <button
                type="button"
                onClick={() => setShowBoost((v) => !v)}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  marginBottom: showBoost ? "0.5rem" : 0
                }}
              >
                {showBoost ? "▾" : "▸"} GitHub Token ile rate limit artır <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>(opsiyonel)</span>
              </button>

              {showBoost && (
                <div className="form-field">
                  <input
                    id="boost-token" type="password" value={boostToken}
                    onChange={(e) => setBoost(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" autoComplete="off"
                  />
                  {boostToken && (
                    <div style={{ fontSize: "0.75rem", color: "#22d3ee", marginTop: "0.3rem" }}>
                      ✅ Token girildi (5000 req/h limits)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || type === "empty"} style={{ marginTop: "0.25rem" }}>
            {loading ? "⏳ Bağlanıyor…" : "🔗 Bağlan"}
          </button>
        </form>

        {error && <p className="error-text" style={{ marginTop: "0.75rem" }}>{error}</p>}

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.6rem", textTransform: "uppercase", fontWeight: 600 }}>Hızlı Giriş</p>
          {[
            ["👤", "mustafakemal0146", "Kullanıcı adı (public)"],
            ["🌐", "https://github.com/mustafakemal0146", "Profil URL"],
            ["🔐", "ghp_xxxxxxxxxxxx", "PAT Token (private repolar)"],
          ].map(([icon, example, desc]) => (
            <button
              key={example} type="button" onClick={() => { setInput(example); setError(""); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem",
                marginBottom: "0.4rem", cursor: "pointer", textAlign: "left",
                color: "var(--text-secondary)", fontSize: "0.8rem", transition: "var(--transition)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span>{icon}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: "var(--text-primary)" }}>{example}</span>
              <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.7rem" }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
