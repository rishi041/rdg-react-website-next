"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Submissions per week. Single series → accent hue, no legend.
// Data: [{ week: "12 Jan", count: 3 }, …] — grouped server-side in admin/page.js.
export default function WeeklyLineChart({ data }) {
  if (!data?.length) return null;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--scroll-bar-color)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "var(--text-color-light)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--text-color-light)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--container-color)",
              border: "none",
              borderRadius: "0.5rem",
              color: "var(--title-color)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Submissions"
            stroke="var(--first-color)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--first-color)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
