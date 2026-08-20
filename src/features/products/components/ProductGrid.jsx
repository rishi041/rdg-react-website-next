import Link from "next/link";
import ProductCard from "./ProductCard";
import { EmptyState } from "@/components/ui";

export default function ProductGrid({ products, hues, emptyTitle = "No products yet" }) {
  if (!products.length) {
    return (
      <EmptyState
        icon="uil-box"
        title={emptyTitle}
        action={
          <Link
            href="/suggest"
            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-alt hover:shadow-md"
          >
            <i className="uil uil-lightbulb-alt" /> Suggest a product
          </Link>
        }
      >
        Be the first — suggest a product!
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} hues={hues} />
      ))}
    </div>
  );
}
