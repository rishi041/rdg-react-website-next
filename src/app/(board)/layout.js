import BoardHeader from "@/features/products/components/BoardHeader";
import BoardFooter from "@/features/products/components/BoardFooter";
import ScrollUpButton from "@/features/portfolio/components/ScrollUpButton";

// OnGoodPicks — the product board's own brand chrome, applied to every route
// in this group (/, /suggest, /products/*, /admin) without changing any URL.
// 📘 title.template: child pages just export `title: "Suggest a product"` and
// Next renders "Suggest a product — OnGoodPicks".
export const metadata = {
  title: {
    default: "OnGoodPicks — community-picked products",
    template: "%s — OnGoodPicks",
  },
  description:
    "Real products suggested by visitors, curated and approved. Find things actually worth buying.",
};

export default function BoardLayout({ children }) {
  return (
    <>
      <BoardHeader />
      {children}
      <BoardFooter />
      <ScrollUpButton />
    </>
  );
}
