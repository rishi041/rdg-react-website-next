import ProductCard from "./ProductCard";

// Horizontal scroll strip of the top products by clicks, with Nº01… rank
// badges and a pulsing live dot (design ref) — replaces the bar chart on the
// public board; the chart still lives in /admin.
export default function TrendingStrip({ products, hues }) {
  if (!products?.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <i className="uil uil-fire text-accent" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-body">
          Trending now
        </h2>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {products.map((p, i) => (
          <div key={p.id} className="w-56 flex-shrink-0">
            <ProductCard product={p} rank={i + 1} hues={hues} />
          </div>
        ))}
      </div>
    </div>
  );
}
