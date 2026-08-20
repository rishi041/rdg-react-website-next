import ProductCard from "./ProductCard";

// Horizontal scroll strip (design ref) with an uppercase mini-heading.
export default function RelatedRow({ products, hues, title = "Related" }) {
  if (!products.length) return null;
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-body-light">
        {title}
      </h3>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-56 flex-shrink-0">
            <ProductCard product={p} hues={hues} />
          </div>
        ))}
      </div>
    </div>
  );
}
