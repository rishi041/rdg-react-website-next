import BoardHeader from "@/features/products/components/BoardHeader";
import BoardFooter from "@/features/products/components/BoardFooter";
import ScrollUpButton from "@/features/portfolio/components/ScrollUpButton";

// Personal-site chrome: only routes inside (portfolio) get this layout.
export const metadata = {
  title: "Rushikesh's Portfolio Website",
  description:
    "Rushikesh Ganorkar — Frontend Engineer specializing in React.js and TypeScript, building scalable and production-grade web applications.",
};

export default function PortfolioLayout({ children }) {
  return (
    <>
      {/* same nav bar as the board, but with the personal wordmark — one
          consistent navigation across the whole site */}
      <BoardHeader brand="portfolio" />
      {children}
      <BoardFooter brand="portfolio" />
      <ScrollUpButton />
    </>
  );
}
