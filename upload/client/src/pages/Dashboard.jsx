import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import api, { withAuth } from "../services/api";
import StatsWidget from "../components/StatsWidget";

function toDayKey(d) { return new Date(d).toISOString().slice(0, 10); }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#14243f", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "0.5rem 0.8rem" }}>
        <p style={{ color: "#8fafd4", fontSize: "0.75rem", marginBottom: "0.2rem" }}>{label}</p>
        <p style={{ color: "#3b82f6", fontWeight: 700 }}>{payload[0].value} commit</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ token }) {
  const [repos, setRepos]     = useState([]);
  const [profile, setProfile] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Profil + repo bilgisini paralel çek
        const [profileRes, reposRes] = await Promise.all([
          api.get("/repos/profile", withAuth(token)),
          api.get("/repos", withAuth(token))
        ]);
        if (!mounted) return;
        setProfile(profileRes.data);
        const top = reposRes.data.slice(0, 5);
        setRepos(reposRes.data);

        const settled = await Promise.allSettled(
          top.map((r) => api.get(`/repos/${r.owner.login}/${r.name}/commits`, withAuth(token)))
        );
        if (!mounted) return;
        const all = settled.filter((x) => x.status === "fulfilled").flatMap((x) => x.value.data);
        setCommits(all);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [token]);

  const stats = useMemo(() => {
    const dayCounts = commits.reduce((acc, c) => {
      const d = c.commit?.author?.date;
      if (!d) return acc;
      const key = toDayKey(d);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Son 14 gün
    const chart14 = Array.from({ length: 14 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      const key = toDayKey(date);
      return {
        day: key.slice(5),
        commits: dayCounts[key] || 0,
        label: date.toLocaleDateString("tr-TR", { weekday: "short", month: "short", day: "numeric" })
      };
    });

    // Haftanın en aktif günü
    const weekdays = commits.reduce((acc, c) => {
      const d = c.commit?.author?.date;
      if (!d) return acc;
      const name = new Date(d).toLocaleDateString("tr-TR", { weekday: "long" });
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    const mostActiveDay = Object.keys(weekdays).sort((a, b) => weekdays[b] - weekdays[a])[0] || "—";

    // Streak hesapla
    const daySet = new Set(Object.keys(dayCounts));
    let streak = 0, cursor = new Date();
    while (daySet.has(toDayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const thisWeek = chart14.slice(-7).reduce((s, d) => s + d.commits, 0);
    const lastWeek = chart14.slice(0, 7).reduce((s, d) => s + d.commits, 0);
    const weekChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

    // En aktif repo
    const repoCounts = commits.reduce((acc, c) => {
      // commit'lerin hangi repo'ya ait olduğunu çıkaramayız; repos'dan al
      return acc;
    }, {});

    return { totalCommits: commits.length, thisWeek, lastWeek, weekChange, mostActiveDay, streak, chart14 };
  }, [commits, repos]);

  // Top 5 repoyu yıldıza göre sırala
  const topRepos = useMemo(() =>
    [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5)
  , [repos]);

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>GitHub aktivitesi yükleniyor…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ─── PROFİL BANNER ─── */}
      {profile && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem",
          display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap"
        }}>
          <img
            src={profile.avatar_url}
            alt={profile.login}
            style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
              {profile.name || profile.login}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              @{profile.login}
              {profile.company && ` · ${profile.company}`}
              {profile.location && ` · 📍 ${profile.location}`}
            </div>
            {profile.bio && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{profile.bio}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexShrink: 0 }}>
            {[
              ["👥", profile.followers, "takipçi"],
              ["👤", profile.following, "takip"],
              ["📦", profile.public_repos, "public repo"],
            ].map(([icon, val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{val}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{icon} {label}</div>
              </div>
            ))}
          </div>
          <a
            href={`https://github.com/${profile.login}`}
            target="_blank" rel="noreferrer"
            className="btn-ghost btn-sm"
            style={{ textDecoration: "none", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            ↗ GitHub Profilim
          </a>
        </div>
      )}

      {/* ─── STAT KARTLARI ─── */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <StatsWidget icon="📦" label="Toplam Repo" value={repos.length} color="#3b82f6" />
        <StatsWidget icon="💾" label="İzlenen Commit" value={stats.totalCommits} color="#6366f1" />
        <StatsWidget icon="📅" label="Bu Hafta" value={stats.thisWeek} color="#22d3ee" />
        <StatsWidget icon="🔥" label="Streak" value={`${stats.streak} gün`} color="#f97316" />
        <StatsWidget icon="📊" label="En Aktif Gün" value={stats.mostActiveDay} color="#a855f7" />
        <StatsWidget
          icon={stats.weekChange >= 0 ? "📈" : "📉"}
          label="Haftalık Değişim"
          value={`${stats.weekChange >= 0 ? "+" : ""}${stats.weekChange}%`}
          color={stats.weekChange >= 0 ? "#22d3ee" : "#f43f5e"}
        />
      </div>

      {/* ─── GRAFİK + TOP REPOLAR YAN YANA ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem" }}>

        {/* BAR GRAFİĞİ — 14 gün */}
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem" }}>📈 Son 14 Gün Aktivitesi</h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span>Bu hafta: <strong style={{ color: "var(--accent)" }}>{stats.thisWeek}</strong></span>
              <span>Geçen hafta: <strong style={{ color: "var(--text-secondary)" }}>{stats.lastWeek}</strong></span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart14} barSize={14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
                <XAxis dataKey="day" tick={{ fill: "#4e6a8d", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "#4e6a8d", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                <Bar dataKey="commits" radius={[5, 5, 0, 0]}>
                  {stats.chart14.map((_, i) => (
                    <Cell key={i} fill={i >= 7 ? "url(#barGradNew)" : "url(#barGradOld)"} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="barGradOld" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP 5 REPO */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="panel-header" style={{ marginBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1rem" }}>⭐ En Popüler Repolar</h2>
          </div>
          {topRepos.map((repo, i) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.5rem 0.65rem",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", textDecoration: "none",
                transition: "var(--transition)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 800, color: "#fff"
              }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {repo.name}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--yellow)", flexShrink: 0 }}>⭐ {repo.stargazers_count}</span>
            </a>
          ))}
          {topRepos.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Henüz yıldızlı repo yok.</p>
          )}
        </div>
      </div>

      {/* ─── REPO DİL DAĞILIMI ─── */}
      {repos.length > 0 && (() => {
        const langMap = repos.reduce((acc, r) => {
          if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
          return acc;
        }, {});
        const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        return (
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem" }}>🗂 Dil Dağılımı</h2>
              <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>{total} repo</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {sorted.map(([lang, count]) => {
                const pct = Math.round((count / total) * 100);
                const color = { JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3572a5", Rust: "#dea584", Go: "#00add8", Java: "#b07219", HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Vue: "#42b883" }[lang] || "#6366f1";
                return (
                  <div key={lang}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.8rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                        {lang}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{count} repo · {pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--bg-hover)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, opacity: 0.8, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
