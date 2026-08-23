import "./globals.css";
import "@/features/portfolio/styles/index.scss";
import "@/features/portfolio/styles/swiper-bundle.min.css";

// 📘 The root layout is now chrome-less: the (board) and (portfolio) route
// groups each bring their OWN header/footer + metadata, so the product board
// is its own brand (OnGoodPicks) while /portfolio stays the personal site.
// Route groups don't change URLs — the parentheses folders are invisible.
export const metadata = {
  icons: { icon: "/title-icon.png" },
};

/*
 * The old App.jsx set a random --hue-color during render via
 * document.documentElement — that crashes on the server (no `document` in SSR).
 * An inline script in <head> runs before first paint: identical behavior, no flash.
 */
const hueInitScript = `
  document.documentElement.style.setProperty("--hue-color", Math.random() * 360);
`;

/*
 * Pre-paint dark theme: BoardHeader (and the portfolio's original Header)
 * apply body.dark-theme in a useEffect (after hydration), which would flash the
 * light theme for dark-mode users on every page load. This script restores the
 * saved theme before the page paints.
 */
const themeInitScript = `
  try {
    if (localStorage.getItem("selected-theme") === "dark") {
      document.body.classList.add("dark-theme");
    }
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the inline scripts above mutate <html> style and
    // <body> class before React hydrates — expected, not a bug.
    // data-scroll-behavior tells Next the CSS smooth scrolling is intentional
    // (it temporarily disables it during route transitions so pages don't
    // visibly glide to the top on navigation)
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* suppressHydrationWarning here too: browser extensions (LocatorJS,
          password managers…) stamp attributes onto <head> before React
          hydrates — the flag is per-element, the one on <html> doesn't cover it */}
      <head suppressHydrationWarning>
        {/* UNICONS — every icon in the app is an <i className="uil uil-*"> */}
        <link
          rel="stylesheet"
          href="https://unicons.iconscout.com/release/v4.0.0/css/line.css"
        />
        <script dangerouslySetInnerHTML={{ __html: hueInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
