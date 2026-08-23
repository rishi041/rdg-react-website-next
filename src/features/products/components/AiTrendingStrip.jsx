import { Badge } from "@/components/ui";

// Weekly AI-generated market trends (NOT products from our database).
// AI can't provide real images or store URLs, so each pick gets an honest
// category-gradient card, an "AI pick" badge, and an Amazon search link.
// `hues` maps category name → hue, straight from the admin-managed table.
// `generatedAt`/`stale` come from the weekly cache: when Gemini's quota is
// gone we keep showing the last stored list and say so.
export default function AiTrendingStrip({
  items,
  hues = {},
  generatedAt,
  stale = false,
}) {
  if (!items?.length) return null;
  const updated = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      })
    : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <i className="uil uil-robot text-accent" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-body">
          AI trending this week
        </h2>
        {updated && (
          <span className="text-[11px] text-body-light">
            <i className="uil uil-clock" /> Updated {updated}
            {stale && " · refresh pending, showing the latest saved list"}
          </span>
        )}
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((item, i) => {
          const hue = hues[item.category] ?? 210;
          return (
            <div
              key={i}
              className="flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-lg border border-solid border-line/70 bg-surface"
            >
              <div
                className="flex h-20 items-center justify-between px-3"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.3), transparent 70%), var(--container-color)`,
                }}
              >
                <span className="text-xs font-medium text-body-light">
                  {item.category}
                </span>
                <Badge>AI pick</Badge>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-sm font-semibold leading-tight text-title">
                  {item.name}
                </h3>
                {item.reason && (
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-body-light">
                    {item.reason}
                  </p>
                )}
                <a
                  href={`https://www.amazon.in/s?k=${encodeURIComponent(item.name)}`}
                  target="_blank"
                  rel="nofollow sponsored noreferrer"
                  className="mt-auto pt-2 text-xs font-medium text-accent hover:text-accent-alt"
                >
                  Find on Amazon <i className="uil uil-arrow-right" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
