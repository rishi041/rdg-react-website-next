import Link from "next/link";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import {
  getProductById,
  getRelatedProducts,
  getCategories,
} from "@/features/products/queries";
import ProductImage from "@/features/products/components/ProductImage";
import BuyNowButton from "@/features/products/components/BuyNowButton";
import ViewTracker from "@/features/products/components/ViewTracker";
import RelatedRow from "@/features/products/components/RelatedRow";
import ChatWidget from "@/features/products/components/ChatWidget";
import ReviewDigestCard from "@/features/products/components/ReviewDigestCard";
import AiTipCard from "@/features/products/components/AiTipCard";
import { hasGeminiKey } from "@/lib/ai";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

// 📘 React cache(): generateMetadata and the page both need the product —
// dedupe to ONE query per request
const loadProduct = cache(getProductById);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);
  return { title: product ? product.name : "Product" };
}

export default async function ProductDetailPage({ params }) {
  // 📘 Next 15+: params is a Promise too.
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound(); // RLS already hides non-approved rows from anon

  const [related, categories] = await Promise.all([
    getRelatedProducts(product.category, [product.id]),
    getCategories(),
  ]);
  const hues = Object.fromEntries(categories.map((c) => [c.name, c.hue]));

  return (
    <main className="main">
      <section className="section container">
        <ViewTracker productId={product.id} />
        <div className="mx-auto flex max-w-5xl flex-col gap-10 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 self-start text-sm text-body-light transition-colors hover:text-accent"
          >
            <i className="uil uil-arrow-left" /> Back
          </Link>
          <div className="grid gap-8 md:grid-cols-2">
            {/* contain, not cover: on the detail page the whole picture
                should be visible (cards crop to fill, here we don't) */}
            <ProductImage
              src={product.image_url}
              alt={product.name}
              hue={hues[product.category] ?? 210}
              fit="contain"
              className="aspect-square w-full rounded-2xl border border-solid border-line/60"
            />
            <div className="flex flex-col gap-4">
              <Badge>{product.category}</Badge>
              <h1 className="text-3xl font-semibold text-title">
                {product.name}
              </h1>
              {product.location && (
                <span className="flex items-center gap-1 text-body-light">
                  <i className="uil uil-map-marker text-accent" />
                  {product.location}
                </span>
              )}
              {product.description && (
                <p className="text-body">{product.description}</p>
              )}
              <div className="mt-2">
                <BuyNowButton product={product} />
              </div>
              {/* 📘 ai_tip is a plain column read once it exists; on the
                  first view AiTipCard generates it ONCE and stores it —
                  inside Suspense so the page streams immediately and the
                  card pops in. */}
              <Suspense fallback={null}>
                <AiTipCard product={product} className="mt-4" />
              </Suspense>
              {/* 📘 Grounded digest: generated on demand via the admin
                  "Generate buyer summary" button (Google Search grounding)
                  and cached on the row — plain column read here. Renders
                  nothing unless it has real sources. */}
              <ReviewDigestCard
                summary={product.review_digest}
                sources={product.review_sources}
                className="mt-2"
              />
            </div>
          </div>
          <RelatedRow products={related} hues={hues} title="More in this category" />
        </div>
      </section>
      {hasGeminiKey() && <ChatWidget />}
    </main>
  );
}
