// Per-product engagement: views → clicks → click-through rate, with an inline
// bar for clicks. A table beats a grouped chart here: exact numbers matter and
// two measures (views, clicks) would otherwise need two series + a legend.
// Server component — plain markup, data already fetched by the admin page.
export default function EngagementTable({ products }) {
  const rows = [...products]
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views)
    .slice(0, 8);
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-body-light">
        No approved products yet — engagement will show up here.
      </p>
    );
  }
  const maxClicks = Math.max(1, ...rows.map((p) => p.clicks));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-body-light">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 text-right font-medium">Views</th>
            <th className="pb-2 text-right font-medium">Clicks</th>
            <th className="pb-2 text-right font-medium" title="Clicks ÷ views">
              CTR
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const ctr = p.views ? Math.round((p.clicks / p.views) * 100) : null;
            return (
              <tr key={p.id} className="border-t border-solid border-line/50">
                <td className="py-2 pr-3">
                  <div className="truncate font-medium text-title" title={p.name}>
                    {p.name}
                  </div>
                  {/* inline bar: clicks relative to the top product */}
                  <div className="mt-1 h-1.5 w-full max-w-xs rounded-full bg-field">
                    <div
                      className="h-1.5 rounded-full bg-accent"
                      style={{ width: `${Math.max(4, (p.clicks / maxClicks) * 100)}%` }}
                    />
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums text-body">{p.views}</td>
                <td className="py-2 text-right tabular-nums text-body">{p.clicks}</td>
                <td className="py-2 text-right tabular-nums text-body">
                  {ctr === null ? "—" : `${ctr}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
