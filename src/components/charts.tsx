"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SOURCE_COLORS: Record<string, string> = {
  reddit: "#EA4510",
  quora: "#c2410c",
  directory: "#14151A",
  blog: "#5B616E",
  brand_site: "#9a3412",
  news: "#78716c",
  other: "#d6d3d1",
};

export function SovChart({
  data,
}: {
  data: { createdAt: string; kind: string; shareOfVoice: number }[];
}) {
  const rows = data.map((item, index) => ({
    name: item.kind === "recheck" ? "Re-check" : index === 0 ? "Baseline" : `Run ${index + 1}`,
    sov: Math.round(item.shareOfVoice * 1000) / 10,
  }));

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E6E8EC" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#5B616E", fontSize: 12 }} axisLine={{ stroke: "#E6E8EC" }} />
          <YAxis
            tick={{ fill: "#5B616E", fontSize: 12 }}
            axisLine={false}
            tickFormatter={(value: number) => `${value}%`}
            domain={[0, 50]}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Share of voice"]}
            contentStyle={{ borderRadius: 12, borderColor: "#E6E8EC" }}
          />
          <Line
            type="monotone"
            dataKey="sov"
            stroke="#EA4510"
            strokeWidth={3}
            dot={{ r: 5, fill: "#EA4510" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceDonut({
  data,
}: {
  data: { sourceType: string; value: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No competitor-win citations yet.</p>;
  }
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const stops = data.map((item) => {
    const start = cursor;
    const pct = (item.value / total) * 100;
    cursor += pct;
    return `${SOURCE_COLORS[item.sourceType] ?? "#9ca3af"} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        className="size-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
          mask: "radial-gradient(circle, transparent 52%, #000 53%)",
          WebkitMask: "radial-gradient(circle, transparent 52%, #000 53%)",
        }}
        aria-hidden
      />
      <ul className="space-y-2 text-sm">
        {data
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((item) => (
            <li key={item.sourceType} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: SOURCE_COLORS[item.sourceType] ?? "#9ca3af" }}
              />
              <span className="capitalize">{item.sourceType.replace("_", " ")}</span>
              <span className="text-muted-foreground">
                {Math.round((item.value / total) * 100)}%
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
