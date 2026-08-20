"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 📘 recharts renders with browser APIs → must be a client component. The
// server page fetches the data and passes a plain array down as a prop
// (the standard "server fetch, client render" charting pattern).
// Single series → single accent hue, no legend; labels use text tokens.
export default function TrendingBarChart({ data }) {
  if (!data?.length) return null;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--scroll-bar-color)"
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "var(--text-color-light)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: "var(--text-color)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--input-color)" }}
            contentStyle={{
              background: "var(--container-color)",
              border: "none",
              borderRadius: "0.5rem",
              color: "var(--title-color)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="clicks"
            name="Clicks"
            fill="var(--first-color)"
            radius={[0, 4, 4, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
