import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import ProductQueue from "@/features/admin/components/ProductQueue";
import CategoryManager from "@/features/admin/components/CategoryManager";
import AiTrendsPanel from "@/features/admin/components/AiTrendsPanel";
import SignOutButton from "@/features/admin/components/SignOutButton";
import { getCategories, getAiTrends } from "@/features/products/queries";
import { hasGeminiKey } from "@/lib/ai";
import WeeklyLineChart from "@/features/admin/components/WeeklyLineChart";
import TrendingBarChart from "@/features/products/components/TrendingBarChart";
import { Card } from "@/components/ui";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

// Group submissions per week for the growth chart (server-side — the chart
// component just receives a plain array).
function groupByWeek(products) {
  const weeks = new Map();
  for (const p of products) {
    const d = new Date(p.submitted_at);
    // normalize to that week's Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      week: new Date(key).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
      count,
    }));
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="main">
        <section className="section container">
          <h2 className="section__title">Admin</h2>
          <span className="section__subtitle">
            Supabase is not configured yet — fill in .env.local (see SETUP.md)
          </span>
        </section>
      </main>
    );
  }

  const supabase = await createClient();

  // 📘 Defense in depth: the proxy already redirects logged-out visitors, but
  // never rely on that alone — verify the session where the data is fetched.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Authenticated = admin (signups are disabled), so RLS lets us read ALL rows.
  const [{ data: products, error }, categories, aiTrends] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .order("submitted_at", { ascending: false }),
    getCategories(),
    getAiTrends(),
  ]);
  if (error) throw new Error(error.message);

  const hues = Object.fromEntries(categories.map((c) => [c.name, c.hue]));
  const pending = products.filter((p) => p.status === "pending");
  const approved = products.filter((p) => p.status === "approved");
  const totalClicks = products.reduce((sum, p) => sum + p.clicks, 0);
  const trending = approved
    .filter((p) => p.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)
    .map(({ id, name, clicks }) => ({ id, name, clicks }));

  const stats = [
    { label: "Total products", value: products.length, icon: "uil-box" },
    { label: "Approved", value: approved.length, icon: "uil-check-circle" },
    { label: "Pending", value: pending.length, icon: "uil-clock" },
    { label: "Total clicks", value: totalClicks, icon: "uil-mouse-alt" },
  ];

  return (
    <main className="main">
      <section className="section container">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-title">Admin</h2>
              <p className="text-sm text-body-light">{user.email}</p>
            </div>
            <SignOutButton />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="flex items-center gap-3">
                <i className={`uil ${s.icon} text-2xl text-accent`} />
                <div>
                  <div className="text-2xl font-semibold text-title">
                    {s.value}
                  </div>
                  <div className="text-sm text-body-light">{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-2 font-semibold text-title">
                <i className="uil uil-chart-line text-accent" /> Submissions per
                week
              </h3>
              <WeeklyLineChart data={groupByWeek(products)} />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-title">
                <i className="uil uil-fire text-accent" /> Top 5 by clicks
              </h3>
              <TrendingBarChart data={trending} />
            </Card>
          </div>

          <CategoryManager categories={categories} />

          <AiTrendsPanel
            generatedAt={aiTrends.generatedAt}
            itemCount={aiTrends.items?.length ?? 0}
            hasKey={hasGeminiKey()}
          />

          <div>
            <h3 className="mb-4 text-lg font-semibold text-title">
              Pending queue ({pending.length})
            </h3>
            <ProductQueue
              items={pending}
              categories={categories.map((c) => c.name)}
              hues={hues}
              mode="pending"
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-title">
              Approved products ({approved.length})
            </h3>
            <ProductQueue
              items={approved}
              categories={categories.map((c) => c.name)}
              hues={hues}
              mode="approved"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
