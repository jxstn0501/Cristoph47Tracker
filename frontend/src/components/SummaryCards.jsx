export default function SummaryCards({ summary, live }) {
  const fmt = (v) => (v == null ? "–" : v.toLocaleString("de-DE"));
  const fmtDate = (v) =>
    v ? new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "–";

  const cards = [
    {
      label: "Positionen gesamt",
      value: fmt(summary?.total_positions),
      icon: "📡",
    },
    {
      label: "Tracking seit",
      value: fmtDate(summary?.tracking_since),
      icon: "📅",
    },
    {
      label: "Max. Höhe",
      value: summary?.max_altitude_ft ? `${fmt(summary.max_altitude_ft)} ft` : "–",
      icon: "📈",
    },
    {
      label: "Ø Geschwindigkeit",
      value: summary?.avg_speed_kt ? `${summary.avg_speed_kt} kt` : "–",
      icon: "💨",
    },
    {
      label: "Zuletzt gesehen",
      value: live?.time
        ? new Date(live.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        : "–",
      icon: "🕐",
    },
    {
      label: "Notfall-Events",
      value: fmt(summary?.emergency_events),
      icon: "🚨",
      highlight: summary?.emergency_events > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg p-3 flex flex-col gap-1 ${
            c.highlight ? "bg-red-900/40 border border-red-600/50" : "bg-slate-800"
          }`}
        >
          <span className="text-lg">{c.icon}</span>
          <span className="text-xl font-bold text-white">{c.value}</span>
          <span className="text-xs text-slate-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
