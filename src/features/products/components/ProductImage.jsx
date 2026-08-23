import Image from "next/image";

// 📘 next/image only optimizes hosts whitelisted in next.config.mjs
// (our Supabase Storage). Visitors can paste image URLs from ANY host, so
// those fall back to a plain <img> — you can't whitelist the whole internet.
function isOptimizable(url) {
  try {
    return new URL(url).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

// `hue` is the product's category color, read from the categories table the
// admin manages — pages pass it down, so there's no hardcoded map here.
// `fit`: "cover" (default — tidy thumbnails/cards, crops to fill) or
// "contain" (detail page — the WHOLE picture is visible, letterboxed on the
// surface colour so nothing like a head or a logo gets cropped away).
export default function ProductImage({
  src,
  alt,
  hue = 210,
  className = "",
  fit = "cover",
}) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  // No-image gradient placeholder, colored per category (blended over the
  // surface color so it works in both themes).
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.3), transparent 70%), var(--container-color)`,
        }}
      >
        <i className="uil uil-box text-3xl text-title/25" />
      </div>
    );
  }

  // contain: the WHOLE picture is always visible inside the box (letterboxed
  // on the surface colour), never cropped — the image is absolutely
  // positioned so the box keeps the size the page gives it (aspect-square).
  // Same plain <img> for every host so detail pages look identical
  // regardless of where the visitor's image lives.
  if (fit === "contain") {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          // !h-full: the portfolio's global `img { height: auto }` (unlayered
          // SCSS) outranks Tailwind's layered utilities — force the height so
          // the picture fits the box instead of keeping its intrinsic height
          className="absolute inset-0 !h-full w-full object-contain"
        />
      </div>
    );
  }

  if (isOptimizable(src)) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className={fitClass}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-surface ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`h-full w-full ${fitClass}`} />
    </div>
  );
}
