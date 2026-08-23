// Minimal number-first stat tiles (design ref): bold value, tiny label.
export default function StatsBar({ stats }) {
  const items = [
    ["Products", stats.totalProducts, "uil-box"],
    ["Views", stats.totalViews ?? 0, "uil-eye"],
    ["Buy clicks", stats.totalClicks, "uil-mouse-alt"],
    ["Categories", stats.totalCategories, "uil-apps"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value, icon]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-lg border border-solid border-line/70 bg-surface px-4 py-3"
        >
          <div>
            <div className="text-xl font-bold text-title">{value}</div>
            <div className="text-xs text-body-light">{label}</div>
          </div>
          <i className={`uil ${icon} text-lg text-accent/70`} />
        </div>
      ))}
    </div>
  );
}
