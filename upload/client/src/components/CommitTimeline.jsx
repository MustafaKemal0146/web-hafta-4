export default function CommitTimeline({ commits }) {
  if (!commits.length) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <div className="empty-icon">📭</div>
        <p>No commits found for this repository.</p>
      </div>
    );
  }

  return (
    <ul className="timeline">
      {commits.map((item) => {
        const date = item.commit?.author?.date
          ? new Date(item.commit.author.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : "";
        const message = item.commit?.message?.split("\n")[0] || "No message";
        const author = item.commit?.author?.name || "Unknown";

        return (
          <li key={item.sha} className="timeline-item">
            <div className="timeline-dot" />
            <div style={{ minWidth: 0 }}>
              <p className="timeline-msg">{message}</p>
              <p className="timeline-meta">
                {author} · {date} ·{" "}
                <a href={item.html_url} target="_blank" rel="noreferrer" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem" }}>
                  {item.sha?.slice(0, 7)}
                </a>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
