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

// Generic single-series column chart (time on X, one measure on Y):
// submissions per week in /admin, AI interest index by month on the board.
// Accent hue, no legend (the title names the series), no entry animation.
// 📘 recharts = browser APIs → client component; pages pass plain arrays.
export default function ColumnChart({ data, xKey, yKey, label, className = "h-52" }) {
  if (!data?.length) return null;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--scroll-bar-color)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "var(--text-color-light)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--text-color-light)", fontSize: 12 }}
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
            dataKey={yKey}
            name={label}
            fill="var(--first-color)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
