const langColors = {
  JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3572a5",
  Rust: "#dea584", Go: "#00add8", Java: "#b07219", "C++": "#f34b7d",
  C: "#555555", HTML: "#e34c26", CSS: "#563d7c", Ruby: "#701516",
  Swift: "#fa7343", Kotlin: "#a97bff", Dart: "#00b4ab", PHP: "#4f5d95",
  Shell: "#89e051", Vue: "#42b883", Svelte: "#ff3e00",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}

export default function RepoCard({ repo, onShowCommits, onBindDraft }) {
  const langColor = langColors[repo.language] || "#8fafd4";

  return (
    <article className="card repo-card-enhanced">
      {/* ─── Başlık ─── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>
          {repo.fork ? "🔀" : "📦"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--accent)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {repo.name}
          </a>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {repo.owner?.login} · güncellendi {timeAgo(repo.updated_at)}
          </span>
        </div>
        {/* public / private / fork rozeti */}
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.45rem",
          borderRadius: 99, flexShrink: 0,
          background: repo.private ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.1)",
          color: repo.private ? "var(--red)" : "#4ade80",
          border: `1px solid ${repo.private ? "rgba(244,63,94,0.25)" : "rgba(34,197,94,0.25)"}`,
        }}>
          {repo.private ? "🔒 Private" : "🌐 Public"}
        </span>
      </div>

      {/* ─── Açıklama ─── */}
      <p style={{
        fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem",
        minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden"
      }}>
        {repo.description || "Açıklama yok."}
      </p>

      {/* ─── Topics ─── */}
      {repo.topics?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.65rem" }}>
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="tag-chip">{t}</span>
          ))}
          {repo.topics.length > 4 && (
            <span className="tag-chip" style={{ opacity: 0.6 }}>+{repo.topics.length - 4}</span>
          )}
        </div>
      )}

      {/* ─── Stat şeridi ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.85rem", alignItems: "center" }}>
        {repo.language && (
          <span className="badge badge-lang">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: langColor, display: "inline-block", flexShrink: 0 }} />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="badge badge-star">⭐ {repo.stargazers_count}</span>
        )}
        {repo.forks_count > 0 && (
          <span className="badge badge-fork">🔀 {repo.forks_count}</span>
        )}
        {repo.open_issues_count > 0 && (
          <span className="badge" style={{ background: "rgba(244,63,94,0.1)", color: "var(--red)", border: "1px solid rgba(244,63,94,0.2)", fontSize: "0.72rem" }}>
            ⚠ {repo.open_issues_count} issue
          </span>
        )}
        {repo.watchers_count > 0 && (
          <span className="badge" style={{ background: "rgba(251,191,36,0.08)", color: "var(--yellow)", border: "1px solid rgba(251,191,36,0.2)", fontSize: "0.72rem" }}>
            👁 {repo.watchers_count}
          </span>
        )}
        {(repo.size || 0) > 0 && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            {repo.size > 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB`}
          </span>
        )}
      </div>

      {/* ─── Lisans + default branch ─── */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
        {repo.license?.spdx_id && (
          <span>📄 {repo.license.spdx_id}</span>
        )}
        {repo.default_branch && (
          <span>🌿 {repo.default_branch}</span>
        )}
        {repo.fork && repo.parent && (
          <span>⬆ {repo.parent.full_name}</span>
        )}
        <span style={{ marginLeft: "auto" }}>
          oluşturuldu {timeAgo(repo.created_at)}
        </span>
      </div>

      {/* ─── Eylemler ─── */}
      <div className="row" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.65rem" }}>
        <button type="button" className="btn-ghost btn-sm" onClick={() => onShowCommits(repo)}>
          🕐 Commits
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => onBindDraft(repo)}>
          📝 Draft Ekle
        </button>
        <a
          href={`${repo.html_url}/graphs/contributors`}
          target="_blank" rel="noreferrer"
          className="btn-ghost btn-sm"
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "var(--text-secondary)" }}
        >
          👥 Katkılar
        </a>
        <a
          href={repo.clone_url}
          onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(repo.clone_url); }}
          className="btn-ghost btn-sm"
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "var(--text-secondary)", cursor: "copy" }}
          title="Clone URL'yi kopyala"
        >
          📋 Clone
        </a>
      </div>
    </article>
  );
}
