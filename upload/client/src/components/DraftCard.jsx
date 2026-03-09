const PRIORITY_COLORS = { low: "low", medium: "medium", high: "high" };
const NEXT_STATUS = { idea: "in-progress", "in-progress": "published", published: "idea" };
const STATUS_LABELS = { idea: "💡", "in-progress": "🔄", published: "✅" };

export default function DraftCard({ draft, onMove, onDelete }) {
  const nextStatus = NEXT_STATUS[draft.status];

  return (
    <article className="draft-card">
      <div className="draft-card-title">
        {draft.title}
      </div>
      {draft.description && (
        <p className="draft-card-desc">{draft.description}</p>
      )}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <span className={`badge badge-${PRIORITY_COLORS[draft.priority] || "medium"}`}>
          {draft.priority} priority
        </span>
        {draft.githubUrl && (
          <a href={draft.githubUrl} target="_blank" rel="noreferrer" className="badge badge-lang">
            ↗ GitHub
          </a>
        )}
      </div>
      {draft.techStack?.length > 0 && (
        <div className="draft-card-stack">
          {draft.techStack.map((tech) => (
            <span key={tech} className="tag-chip">{tech}</span>
          ))}
        </div>
      )}
      <div className="draft-card-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={() => onMove(draft, nextStatus)}>
          {STATUS_LABELS[nextStatus]} Move to {nextStatus === "in-progress" ? "In Progress" : nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
        </button>
        <button type="button" className="btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={() => onDelete(draft._id)}>
          🗑
        </button>
      </div>
    </article>
  );
}
