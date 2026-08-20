import SuggestForm from "@/features/suggest/components/SuggestForm";
import { getCategories } from "@/features/products/queries";

export const metadata = { title: "Suggest a product — Rushikesh's Portfolio" };
export const dynamic = "force-dynamic"; // category list is admin-editable

// 📘 Server component shell fetches the DB-driven categories and hands them
// to the client form as a plain prop.
export default async function SuggestPage() {
  const categories = await getCategories();
  return (
    <main className="main">
      <section className="section container">
        <h2 className="section__title">Suggest a product</h2>
        <span className="section__subtitle">
          Recommendations go live once approved
        </span>
        <div className="pt-8">
          <SuggestForm categories={categories.map((c) => c.name)} />
        </div>
      </section>
    </main>
  );
}
