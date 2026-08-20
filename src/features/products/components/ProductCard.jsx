import Link from "next/link";
import ProductImage from "./ProductImage";
import BuyNowButton from "./BuyNowButton";

// Compact card (design ref: products-page.jsx mock): media strip on top,
// name + accent location pin, description slides open on hover, small
// full-width Buy CTA. `rank` renders the trending "Nº01" badge.
// 📘 Server component composing one client island (BuyNowButton).
export default function ProductCard({ product, rank, hues }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative block overflow-hidden rounded-lg border border-solid border-line/70 bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
    >
      {rank && (
        <span className="absolute top-2 left-2 z-10 rounded bg-page/85 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-accent">
          Nº{String(rank).padStart(2, "0")}
        </span>
      )}
      <div className="relative h-32 overflow-hidden">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          hue={hues?.[product.category] ?? 210}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold leading-tight text-title">
          {product.name}
        </h3>
        {product.location && (
          <span className="mt-1 flex items-center gap-1 text-xs text-accent">
            <i className="uil uil-map-marker" />
            <span className="truncate">{product.location}</span>
          </span>
        )}
        {product.description && (
          <p className="h-0 overflow-hidden text-xs leading-snug text-body-light opacity-0 transition-all duration-300 group-hover:mt-2 group-hover:h-8 group-hover:opacity-100">
            {product.description}
          </p>
        )}
        <div className="mt-2">
          <BuyNowButton product={product} compact />
        </div>
      </div>
    </Link>
  );
}
