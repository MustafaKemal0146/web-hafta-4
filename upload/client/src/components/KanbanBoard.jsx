import DraftCard from "./DraftCard";

const COLUMNS = [
  { key: "idea",        label: "💡 Idea",         headerClass: "kanban-header-idea" },
  { key: "in-progress", label: "🔄 In Progress",   headerClass: "kanban-header-in-progress" },
  { key: "published",   label: "✅ Published",      headerClass: "kanban-header-published" },
];

export default function KanbanBoard({ drafts, onMove, onDelete }) {
  return (
    <div className="kanban">
      {COLUMNS.map((col) => {
        const colDrafts = drafts.filter((d) => d.status === col.key);
        return (
          <section key={col.key} className="kanban-column">
            <div className={`kanban-column-header ${col.headerClass}`}>
              {col.label}
              <span className="kanban-count">{colDrafts.length}</span>
            </div>
            {colDrafts.length === 0 && (
              <div className="empty-state" style={{ padding: "1.5rem 1rem" }}>
                <div className="empty-icon" style={{ fontSize: "1.5rem", opacity: 0.25 }}>○</div>
                <p style={{ fontSize: "0.75rem" }}>No drafts here</p>
              </div>
            )}
            {colDrafts.map((draft) => (
              <DraftCard key={draft._id} draft={draft} onMove={onMove} onDelete={onDelete} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
