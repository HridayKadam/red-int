"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
          <Line type="monotone" dataKey="sov" stroke="#EA4510" strokeWidth={3} dot={{ r: 5, fill: "#EA4510" }} />
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
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="sourceType" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.sourceType} fill={SOURCE_COLORS[entry.sourceType] ?? "#9ca3af"} />
            ))}
          </Pie>
          <Legend />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E6E8EC" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
