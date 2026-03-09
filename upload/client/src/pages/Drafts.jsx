import { useState } from "react";
import api from "../services/api";
import KanbanBoard from "../components/KanbanBoard";

const emptyForm = { title: "", description: "", priority: "medium", techStack: "", githubUrl: "" };

export default function Drafts({ drafts, setDrafts }) {
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const createDraft = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      techStack: form.techStack.split(",").map((s) => s.trim()).filter(Boolean)
    };
    const res = await api.post("/drafts", payload);
    setDrafts((prev) => [res.data, ...prev]);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const moveDraft = async (draft, status) => {
    if (draft.status === status) return;
    const previous = drafts;
    setDrafts((prev) => prev.map((item) => (item._id === draft._id ? { ...item, status } : item)));
    try {
      await api.put(`/drafts/${draft._id}`, { status });
    } catch {
      setDrafts(previous);
    }
  };

  const deleteDraft = async (id) => {
    const previous = drafts;
    setDrafts((prev) => prev.filter((item) => item._id !== id));
    try {
      await api.delete(`/drafts/${id}`);
    } catch {
      setDrafts(previous);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📝 Project Drafts</h2>
        <button
          type="button"
          className="btn-primary btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={() => setFormOpen((v) => !v)}
        >
          {formOpen ? "✕ Cancel" : "+ New Draft"}
        </button>
      </div>

      {formOpen && (
        <form className="form-grid" onSubmit={createDraft}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-field">
              <label htmlFor="title">Title *</label>
              <input id="title" value={form.title} onChange={set("title")} minLength={3} required placeholder="My awesome project" />
            </div>
            <div className="form-field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={form.priority} onChange={set("priority")}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={set("description")} rows={2} placeholder="What is this project about?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-field">
              <label htmlFor="stack">Tech Stack <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(comma separated)</span></label>
              <input id="stack" value={form.techStack} onChange={set("techStack")} placeholder="React, Node.js, MongoDB" />
            </div>
            <div className="form-field">
              <label htmlFor="githubUrl">GitHub URL</label>
              <input id="githubUrl" value={form.githubUrl} onChange={set("githubUrl")} placeholder="https://github.com/..." />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: "fit-content" }}>
            ✦ Create Draft
          </button>
        </form>
      )}

      <KanbanBoard drafts={drafts} onMove={moveDraft} onDelete={deleteDraft} />
    </section>
  );
}
