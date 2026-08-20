import Link from "next/link";

// X logo isn't in Unicons v4 — same inline SVG the old portfolio footer used.
function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14">
      <path
        fill="currentColor"
        d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
      />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://www.linkedin.com/in/rushikesh-ganorkar-rd/", label: "LinkedIn", icon: <i className="uil uil-linkedin-alt" /> },
  { href: "https://github.com/rishi041", label: "GitHub", icon: <i className="uil uil-github-alt" /> },
  { href: "https://x.com/rdganorkars3", label: "X", icon: <XIcon /> },
];

// Shared site footer — same layout for both sections, two brands:
//   brand="board"     → OnGoodPicks + Explore + Maker credit (default)
//   brand="portfolio" → Rushikesh Ganorkar + Explore + social icons
// Background is the portfolio's original footer color (--first-color-second):
// accent-colored in light theme, deep hue-tinted dark in dark theme — with
// white text, so the footer reads as a distinct band like the old design.
export default function BoardFooter({ brand = "board" }) {
  const isPortfolio = brand === "portfolio";
  return (
    <footer
      className="mt-16"
      style={{ backgroundColor: "var(--first-color-second)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          {isPortfolio ? (
            <>
              <div className="font-bold tracking-tight text-white">
                Rushikesh Ganorkar
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Frontend Engineer
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-base text-white">
                  <i className="uil uil-shopping-bag" />
                </span>
                <span className="font-bold tracking-tight text-white">
                  OnGoodPicks
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Real products suggested by visitors, curated and approved — find
                things actually worth buying.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-white">Explore</span>
          <Link href="/" className="text-white/70 transition-colors hover:text-white">
            Products
          </Link>
          <Link href="/suggest" className="text-white/70 transition-colors hover:text-white">
            Suggest a product
          </Link>
        </div>

        {isPortfolio ? (
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white">Social</span>
            <div className="flex items-center gap-4 text-lg">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="text-white transition-colors hover:text-white/70"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white">Maker</span>
            <Link
              href="/portfolio"
              className="text-white/70 transition-colors hover:text-white"
            >
              Built by Rushikesh Ganorkar <i className="uil uil-arrow-right" />
            </Link>
          </div>
        )}
      </div>
      <div className="border-t border-solid border-white/15 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()}{" "}
        {isPortfolio ? "Rushikesh Ganorkar" : "OnGoodPicks"}. All rights
        reserved.
      </div>
    </footer>
  );
}
