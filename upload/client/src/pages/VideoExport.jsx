import { useEffect, useState } from "react";
import api, { withAuth } from "../services/api";
import ExportTerminal from "../components/ExportTerminal";

const STATUS_CLASS = { done: "badge-done", pending: "badge-pending", failed: "badge-failed" };

export default function VideoExport({ token }) {
  const [repos, setRepos]       = useState([]);
  const [selected, setSelected] = useState(null); // tam repo objesi
  const [logs, setLogs]         = useState("");
  const [history, setHistory]   = useState([]);
  const [running, setRunning]   = useState(false);
  const [repoPath, setRepoPath] = useState("");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    api.get("/repos", withAuth(token))
      .then((res) => { setRepos(res.data); setSelected(res.data[0] || null); })
      .catch(() => setRepos([]));
    api.get("/export/history")
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]));
  }, [token]);

  useEffect(() => {
    if (!window.electronAPI?.onExportProgress) return undefined;
    const unsub = window.electronAPI.onExportProgress((chunk) =>
      setLogs((prev) => prev + chunk)
    );
    return unsub;
  }, []);

  const runExport = async () => {
    if (!selected) return;
    setLogs(""); 
    setRunning(true);
    
    const record = await api.post("/export/video", { repoName: selected.full_name, status: "pending" });
    
    try {
      await new Promise((resolve, reject) => {
        const streamUrl = `/api/export/video/stream?repoPath=${encodeURIComponent(repoPath)}`;
        const evtSource = new EventSource(streamUrl);

        evtSource.addEventListener("progress", (e) => {
          const data = JSON.parse(e.data);
          setLogs((prev) => prev + data);
        });

        evtSource.addEventListener("done", async (e) => {
          const result = JSON.parse(e.data);
          evtSource.close();
          await api.put(`/export/video/${record.data._id}`, {
            status: result.success ? "done" : "failed",
            filePath: result.success ? "generated-by-create-video" : ""
          });
          resolve(result);
        });

        evtSource.onerror = (err) => {
          evtSource.close();
          setLogs((prev) => prev + "\\n[❌ Bağlantı koptu veya hata oluştu]\\n");
          reject(err);
        };
      });
    } catch (err) {
      await api.put(`/export/video/${record.data._id}`, { status: "failed" });
    } finally {
      const h = await api.get("/export/history");
      setHistory(h.data);
      setRunning(false);
    }
  };

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🎬 Video Export</h2>
      </div>

      {/* ─── REPO SEÇİCİ ─── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="section-title" style={{ marginBottom: "0.5rem" }}>Repository seç</p>
        <input
          placeholder="🔍 Repo ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "0.75rem", maxWidth: 360 }}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: "0.6rem",
          maxHeight: 320,
          overflowY: "auto",
          paddingRight: "0.25rem"
        }}>
          {filtered.map((repo) => {
            const isSelected = selected?.id === repo.id;
            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => setSelected(repo)}
                style={{
                  textAlign: "left",
                  background: isSelected
                    ? "rgba(59,130,246,0.18)"
                    : "var(--bg-card)",
                  border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "0.75rem 0.9rem",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "var(--transition)",
                  boxShadow: isSelected ? "0 0 0 2px rgba(59,130,246,0.3)" : "none"
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {isSelected && <span style={{ color: "var(--accent)" }}>✦</span>}
                  {repo.name}
                </div>
                {repo.description && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {repo.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {repo.language && (
                    <span className="badge badge-lang" style={{ fontSize: "0.68rem" }}>{repo.language}</span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="badge badge-star" style={{ fontSize: "0.68rem" }}>⭐ {repo.stargazers_count}</span>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", gridColumn: "1/-1" }}>
              Aramanızla eşleşen repo bulunamadı.
            </p>
          )}
        </div>
      </div>

      {/* ─── SEÇİLEN REPO BİLGİSİ ─── */}
      {selected && (
        <div style={{
          background: "rgba(59,130,246,0.07)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "var(--radius)",
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <span style={{ fontSize: "1.2rem" }}>📦</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--accent)" }}>{selected.full_name}</div>
            {selected.description && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{selected.description}</div>
            )}
          </div>
          <a href={selected.html_url} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>↗ GitHub</a>
        </div>
      )}

      {/* ─── LOCAL PATH + BAŞLAT ─── */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="form-field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <label htmlFor="repoPath" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Yerel repo klasörü <span style={{ fontWeight: 400 }}>(opsiyonel)</span>
          </label>
          <input id="repoPath" placeholder="/home/kullanici/proje" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={runExport} disabled={running || !selected}
          style={{ flexShrink: 0 }}>
          {running ? "⏳ Export ediliyor…" : "▶ Export Başlat"}
        </button>
      </div>

      <p className="section-title" style={{ marginBottom: "0.5rem" }}>Terminal Çıktısı</p>
      <ExportTerminal logs={logs} />

      {history.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Export Geçmişi</p>
          <div className="history-list">
            {history.map((item) => (
              <div key={item._id} className="history-item">
                <span className="history-repo">📦 {item.repoName}</span>
                <span className={`badge ${STATUS_CLASS[item.status] || "badge-pending"}`}>{item.status}</span>
                <span className="history-date">
                  {new Date(item.exportDate).toLocaleString("tr-TR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
