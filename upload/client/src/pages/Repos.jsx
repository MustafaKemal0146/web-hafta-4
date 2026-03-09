import { useEffect, useMemo, useState } from "react";
import api, { withToken } from "../services/api";
import RepoCard from "../components/RepoCard";
import CommitTimeline from "../components/CommitTimeline";

export default function Repos({ token }) {
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [language, setLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);

  useEffect(() => {
    api.get("/repos", withToken(token))
      .then((res) => setRepos(res.data))
      .catch(() => setRepos([]))
      .finally(() => setLoadingRepos(false));
  }, [token]);

  const languages = useMemo(() => {
    const all = repos.map((r) => r.language).filter(Boolean);
    return ["all", ...new Set(all)];
  }, [repos]);

  const filtered = useMemo(() => {
    const byLang = repos.filter((r) => language === "all" || r.language === language);
    const sorted = [...byLang];
    if (sortBy === "stars") sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    else if (sortBy === "created") sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return sorted;
  }, [repos, language, sortBy]);

  const showCommits = async (repo) => {
    setSelectedRepo(repo);
    setLoadingCommits(true);
    try {
      const res = await api.get(`/repos/${repo.owner.login}/${repo.name}/commits`, withToken(token));
      setCommits(res.data);
    } catch {
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  };

  const bindDraft = async (repo) => {
    try {
      await api.post("/drafts", {
        title: repo.name,
        description: repo.description || "",
        githubUrl: repo.html_url,
        techStack: repo.language ? [repo.language] : []
      });
      // Small toast-like effect via title flash (no external lib needed)
      document.title = "✅ Draft linked! — DevCanvas";
      setTimeout(() => { document.title = "DevCanvas"; }, 2000);
    } catch {
      // silent
    }
  };

  if (loadingRepos) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Fetching your repositories…</span>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📁 Repositories</h2>
        <span className="badge badge-lang" style={{ marginLeft: "auto" }}>{filtered.length} repos</span>
      </div>

      <div className="filter-row">
        <label htmlFor="language">Language</label>
        <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang === "all" ? "All Languages" : lang}</option>
          ))}
        </select>
        <label htmlFor="sortBy">Sort by</label>
        <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="updated">Recently Updated</option>
          <option value="stars">Most Stars</option>
          <option value="created">Newest First</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No repositories match your filters.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((repo) => (
            <RepoCard key={repo.id} repo={repo} onShowCommits={showCommits} onBindDraft={bindDraft} />
          ))}
        </div>
      )}

      {selectedRepo && (
        <div className="subpanel">
          <h3 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            🕐 Commit timeline — <span style={{ color: "var(--accent)" }}>{selectedRepo.owner.login}/{selectedRepo.name}</span>
          </h3>
          {loadingCommits ? (
            <div className="loading-wrap" style={{ padding: "1.5rem" }}>
              <div className="spinner" />
            </div>
          ) : (
            <CommitTimeline commits={commits} />
          )}
        </div>
      )}
    </section>
  );
}
