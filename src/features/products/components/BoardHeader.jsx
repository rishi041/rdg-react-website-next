"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Products", icon: "uil-store" },
  { href: "/suggest", label: "Suggest", icon: "uil-lightbulb-alt" },
  { href: "/portfolio", label: "Portfolio", icon: "uil-user" },
];

function Wordmark({ brand, small = false }) {
  if (brand === "portfolio") {
    return (
      <Link
        href="/portfolio"
        className="font-medium text-title transition-colors hover:text-accent"
      >
        Rushikesh Ganorkar
      </Link>
    );
  }
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        className={`flex items-center justify-center rounded-lg bg-accent text-white ${
          small ? "h-7 w-7 text-base" : "h-8 w-8 text-lg"
        }`}
      >
        <i className="uil uil-shopping-bag" />
      </span>
      <span className={`font-bold tracking-tight ${small ? "" : "text-lg"}`}>
        <span className="text-accent">On</span>
        <span className="text-title">GoodPicks</span>
      </span>
    </Link>
  );
}

// Shared site header — one nav for the whole site, two brands:
//   brand="board"     → OnGoodPicks wordmark (default)
//   brand="portfolio" → "Rushikesh Ganorkar" plain wordmark
// Desktop/tablet: sticky top bar. Phones: the original portfolio pattern —
// a fixed BOTTOM bar (wordmark + theme toggle + menu button) that slides up
// a grid menu of icon-over-label links.
// 📘 ONE theme contract: the toggle writes the same localStorage keys +
// body class the original portfolio Header used, and the root layout's
// pre-paint script restores it on every load.
export default function BoardHeader({ brand = "board" }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [isDark, setIsDark] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("selected-theme") === "dark",
  );

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDark);
    localStorage.setItem("selected-theme", isDark ? "dark" : "light");
    localStorage.setItem("selected-icon", isDark ? "uil-sun" : "uil-moon");
  }, [isDark]);

  const themeButton = (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setIsDark((v) => !v)}
      className="flex cursor-pointer items-center border-none bg-transparent text-xl text-title transition-colors hover:text-accent"
    >
      {/* 📘 the server can't read localStorage, so it can't know which icon
          to render. Render BOTH and let CSS pick via body.dark-theme (the
          `dark:` variant) — no hydration mismatch, correct from first paint. */}
      <i className="uil uil-moon dark:hidden" />
      <i className="uil uil-sun hidden dark:inline" />
    </button>
  );

  return (
    <>
      {/* ── Desktop / tablet: sticky top bar (hidden on phones).
          Solid page background so it blends in, portfolio-style. */}
      <header className="sticky top-0 z-30 hidden bg-page sm:block">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Wordmark brand={brand} />
          <div className="flex items-center gap-2">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[0.813rem] font-medium transition-colors ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-title hover:text-accent"
                  }`}
                >
                  <i className={`uil ${item.icon}`} /> {item.label}
                </Link>
              );
            })}
            {themeButton}
          </div>
        </nav>
      </header>

      {/* ── Phones: fixed bottom bar + slide-up grid menu (the original
          portfolio mobile pattern). The portfolio SCSS already gives <body>
          a bottom margin of --header-height, so content never hides
          behind the bar. */}
      <header className="fixed inset-x-0 bottom-0 z-40 bg-surface shadow-[0_-1px_6px_rgba(0,0,0,0.15)] sm:hidden">
        {/* slide-up menu sits behind/above the bar */}
        <div
          className={`absolute inset-x-0 bottom-full rounded-t-2xl bg-surface px-6 pt-6 pb-4 shadow-[0_-2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 ${
            showMenu
              ? "visible translate-y-0 opacity-100"
              : "invisible translate-y-4 opacity-0"
          }`}
        >
          <ul className="grid grid-cols-3 gap-6 text-center">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className={`flex flex-col items-center gap-1 text-xs font-medium ${
                      active ? "text-accent" : "text-title"
                    }`}
                  >
                    <i className={`uil ${item.icon} text-lg`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setShowMenu(false)}
            className="absolute right-5 bottom-3 cursor-pointer border-none bg-transparent text-xl text-accent hover:text-accent-alt"
          >
            <i className="uil uil-times" />
          </button>
        </div>

        <nav className="flex items-center justify-between px-4 py-3">
          <Wordmark brand={brand} small />
          <div className="flex items-center gap-4">
            {themeButton}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setShowMenu((v) => !v)}
              className="flex cursor-pointer items-center border-none bg-transparent text-xl text-title transition-colors hover:text-accent"
            >
              <i className="uil uil-apps" />
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
