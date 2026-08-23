"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Chip } from "@/components/ui";

// 📘 URL-as-state: this client component only WRITES ?q=&category= to the URL.
// The server page re-renders with the filtered data. You get shareable links
// and a working back button for free — no client data fetching or state sync.
// 📘 categories arrive as a prop from the server page (fetched from the DB) —
// client components can't query the DB themselves without shipping keys/logic.
export default function SearchFilterBar({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQ = searchParams.get("q") ?? "";
  const activeCategory = searchParams.get("category") ?? "";

  const [text, setText] = useState(activeQ);
  const [lastQ, setLastQ] = useState(activeQ);
  const debounceRef = useRef(null);
  // don't fire a pending navigation after unmount (e.g. user clicked away)
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // keep the input in sync when the URL changes via back/forward
  // 📘 "adjust state during render" — React's recommended pattern for deriving
  // state from a changed prop, instead of a setState inside useEffect
  if (lastQ !== activeQ) {
    setLastQ(activeQ);
    setText(activeQ);
  }

  const navigate = (q, category) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    clearTimeout(debounceRef.current);
    // debounce: don't re-query the server on every keystroke
    debounceRef.current = setTimeout(() => navigate(value.trim(), activeCategory), 400);
  };

  return (
    // search input + category chips share one row on desktop, stack on mobile.
    // The search box keeps a fixed comfortable width; the chips (admin-managed,
    // can grow) take the rest and WRAP instead of squeezing the input.
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative w-full md:w-72 md:shrink-0 lg:w-80">
        <i className="uil uil-search absolute top-1/2 left-4 -translate-y-1/2 text-body-light" />
        <Input
          value={text}
          onChange={handleTextChange}
          placeholder="Search products…"
          className="!pl-11 !pr-10"
          aria-label="Search products"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              navigate("", activeCategory);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer border-none bg-transparent text-body-light hover:text-accent"
          >
            <i className="uil uil-times" />
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <Chip active={!activeCategory} onClick={() => navigate(activeQ, "")}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c}
            active={activeCategory === c}
            onClick={() => navigate(activeQ, activeCategory === c ? "" : c)}
          >
            {c}
          </Chip>
        ))}
      </div>
    </div>
  );
}
