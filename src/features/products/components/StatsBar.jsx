// Minimal number-first stat tiles (design ref): bold value, tiny label.
export default function StatsBar({ stats }) {
  const items = [
    ["Products", stats.totalProducts],
    ["Total clicks", stats.totalClicks],
    ["Categories", stats.totalCategories],
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-solid border-line/70 bg-surface px-4 py-3"
        >
          <div className="text-xl font-bold text-title">{value}</div>
          <div className="text-xs text-body-light">{label}</div>
        </div>
      ))}
    </div>
  );
}
