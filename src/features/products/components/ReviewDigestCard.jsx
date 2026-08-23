import { Card } from "@/components/ui";

// Display label for a source chip: Gemini usually returns the site domain as
// `title`; fall back to the URL's hostname. Only http(s) links are rendered.
function sourceLabel(s) {
  if (s.title) return s.title;
  try {
    return new URL(s.url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

// "What buyers are saying" — a Google-Search-grounded AI summary WITH its
// sources. Presentational + server-safe: used on the product detail page
// (data from products.review_digest/review_sources) and inside SearchDigest.
// Renders nothing unless there's both a summary and at least one source —
// the copy deliberately says "AI summary, with sources", never "reviews".
export default function ReviewDigestCard({ summary, sources, className = "" }) {
  const links = (sources ?? []).filter((s) => /^https?:\/\//i.test(s?.url ?? ""));
  if (!summary || !links.length) return null;

  return (
    <Card className={`flex items-start gap-3 border-l-4 border-l-accent ${className}`}>
      <i className="uil uil-comments-alt mt-0.5 text-xl text-accent" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-title">
            What buyers are saying
          </span>
          <span className="text-xs text-body-light">AI summary, with sources</span>
        </div>
        <p className="text-sm leading-relaxed text-body">{summary}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {links.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-solid border-line bg-field px-2 py-0.5 text-xs text-body transition-colors hover:border-accent hover:text-accent"
            >
              {sourceLabel(s)} <i className="uil uil-external-link-alt" />
            </a>
          ))}
        </div>
      </div>
    </Card>
  );
}
