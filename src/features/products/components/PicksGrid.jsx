// Presentational grid of AI-picked products, each card opening Google
// Shopping for that product (deterministic search links — no invented store
// URLs, no fake images/prices). Shared by the search fallback
// (ShoppingPicks) and the board's "Top picks in India" tabs (IndiaPicks).
// Plain component: no hooks, so it works inside any client island.
export const shopUrl = (q) =>
  `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;

export function PicksSkeleton({ count = 3, cols }) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border border-solid border-line/70 bg-surface"
        />
      ))}
    </div>
  );
}

export default function PicksGrid({
  items,
  hues = {},
  cols = "grid-cols-2 sm:grid-cols-3",
  ranked = false,
}) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {items.map((item, i) => {
        const hue = hues[item.category] ?? 210;
        // don't double the brand when the model already put it in the name
        const query =
          item.brand &&
          !item.name.toLowerCase().startsWith(item.brand.toLowerCase())
            ? `${item.brand} ${item.name}`
            : item.name;
        return (
          <a
            key={i}
            href={shopUrl(query)}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-lg border border-solid border-line/70 bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
          >
            <div
              className="flex h-16 items-center justify-between px-3"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.3), transparent 70%), var(--container-color)`,
              }}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-body-light">
                {ranked && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                )}
                {item.category}
              </span>
              {item.brand && (
                <span className="ml-2 max-w-[50%] truncate rounded bg-page/70 px-1.5 py-0.5 text-[10px] font-medium text-title">
                  {item.brand}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="text-sm font-semibold leading-tight text-title">
                {item.name}
              </h3>
              {item.priceHint && (
                <div className="mt-1 text-xs text-body">
                  {item.priceHint}{" "}
                  <span className="text-body-light">≈ est.</span>
                </div>
              )}
              {item.reason && (
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-body-light">
                  {item.reason}
                </p>
              )}
              <span className="mt-auto pt-2 text-xs font-medium text-accent group-hover:text-accent-alt">
                View on Google Shopping <i className="uil uil-arrow-right" />
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
