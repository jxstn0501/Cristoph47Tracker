import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded p-2 text-xs text-slate-200">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function StatsChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        Keine Daten vorhanden
      </div>
    );
  }

  const formatted = [...data]
    .reverse()
    .map((d) => ({
      tag: new Date(d.day).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      Positionen: d.position_count,
      "Max Höhe (ft)": d.max_altitude_ft ?? 0,
      "Ø Speed (kt)": parseFloat(d.avg_speed_kt ?? 0),
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="tag" tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 4 }}
        />
        <Bar dataKey="Positionen" fill="#ef4444" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Ø Speed (kt)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
