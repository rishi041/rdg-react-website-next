"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";

// Horizontal single-series bar chart (clicks per product, products per
// category…). 📘 recharts needs browser APIs → client component; the server
// page fetches and passes a plain array ("server fetch, client render").
// - height grows with the row count, so 2 rows don't float in a 224px box
// - no entry animation: bars are complete on first paint (no blank-chart flash)
// - single series → one accent hue, no legend; values direct-labeled (≤ 8 rows)
const ROW_H = 40;

export default function TrendingBarChart({
  data,
  valueKey = "clicks",
  valueLabel = "Clicks",
}) {
  if (!data?.length) return null;
  const height = Math.max(96, data.length * ROW_H + 32);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
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
            dataKey={valueKey}
            name={valueLabel}
            fill="var(--first-color)"
            radius={[0, 4, 4, 0]}
            barSize={14}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={valueKey}
              position="right"
              style={{ fill: "var(--text-color)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
