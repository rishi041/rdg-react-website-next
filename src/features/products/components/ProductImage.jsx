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
export default function ProductImage({ src, alt, hue = 210, className = "" }) {
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

  if (isOptimizable(src)) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  );
}
