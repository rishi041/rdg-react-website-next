"use client";

import { useEffect, useState } from "react";

// Small AI "Quick tip" box shown while searching (design ref: accent-tinted
// panel with a shimmer line while loading). The API route caches tips per
// term in Postgres, so each term costs at most one Gemini call ever.
export default function SearchTip({ term }) {
  const isValid = Boolean(term && term.length >= 2);
  const [tip, setTip] = useState(null);
  const [failed, setFailed] = useState(false);
  const [lastTerm, setLastTerm] = useState(term);

  // reset when the term changes ("adjust state during render" pattern)
  if (lastTerm !== term) {
    setLastTerm(term);
    setTip(null);
    setFailed(false);
  }

  useEffect(() => {
    if (!isValid) return;
    let cancelled = false; // 📘 ignore stale responses when the term changes fast
    fetch(`/api/search-tip?term=${encodeURIComponent(term)}`)
      .then((res) => (res.ok ? res.json() : { tip: null }))
      .then((data) => {
        if (cancelled) return;
        if (data.tip) setTip(data.tip);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [term, isValid]);

  if (!isValid || failed) return null;
  const loading = !tip; // 📘 loading is derived, not stored — one less state to sync

  return (
    <div className="rounded-lg border border-solid border-accent/30 bg-accent/10 px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent">
        <i className="uil uil-lightbulb-alt" /> Quick tip
      </div>
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading tip">
          <div className="shimmer h-3.5 w-11/12 rounded" />
          <div className="shimmer h-3.5 w-2/3 rounded" />
        </div>
      ) : (
        <p className="text-sm leading-snug text-body">{tip}</p>
      )}
    </div>
  );
}
