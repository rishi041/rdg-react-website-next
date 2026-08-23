"use client";

import { useEffect, useState } from "react";
import ReviewDigestCard from "./ReviewDigestCard";

// Grounded buyer-sentiment digest for the current search term — same
// client pattern as SearchTip (cache-first API route, hide on failure).
// While loading it shows a quiet shimmer; if grounding isn't available
// (no quota / no sources) it renders nothing — never fabricated content.
export default function SearchDigest({ term }) {
  const isValid = Boolean(term && term.length >= 2);
  const [digest, setDigest] = useState(null);
  const [failed, setFailed] = useState(false);
  const [lastTerm, setLastTerm] = useState(term);

  if (lastTerm !== term) {
    setLastTerm(term);
    setDigest(null);
    setFailed(false);
  }

  useEffect(() => {
    if (!isValid) return;
    let cancelled = false;
    fetch(`/api/search-digest?term=${encodeURIComponent(term)}`)
      .then((res) => (res.ok ? res.json() : { summary: null }))
      .then((data) => {
        if (cancelled) return;
        if (data.summary && data.sources?.length) setDigest(data);
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

  if (!digest) {
    return (
      <div className="rounded-lg border border-solid border-line/70 bg-surface px-4 py-3">
        <div className="mb-2 h-3 w-40 animate-pulse rounded bg-field" />
        <div className="h-3 w-full animate-pulse rounded bg-field" />
      </div>
    );
  }

  return <ReviewDigestCard summary={digest.summary} sources={digest.sources} />;
}
