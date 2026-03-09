export default function StatsWidget({ icon, label, value, color = "#3b82f6" }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ background: `linear-gradient(135deg, #f0f6ff, ${color})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {value ?? "—"}
      </div>
    </article>
  );
}
