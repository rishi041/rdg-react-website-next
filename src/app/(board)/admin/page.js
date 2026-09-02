import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import ProductQueue from "@/features/admin/components/ProductQueue";
import CategoryManager from "@/features/admin/components/CategoryManager";
import AiTrendsPanel from "@/features/admin/components/AiTrendsPanel";
import SignOutButton from "@/features/admin/components/SignOutButton";
import { getCategories, getAiTrends } from "@/features/products/queries";
import { hasGeminiKey } from "@/lib/ai";
import ColumnChart from "@/features/products/components/ColumnChart";
import EngagementTable from "@/features/admin/components/EngagementTable";
import TrendingBarChart from "@/features/products/components/TrendingBarChart";
import { Card } from "@/components/ui";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";
// server actions POST to this route — "Regenerate now" runs ~2 Gemini calls
export const maxDuration = 60;

// Submissions per week over a FIXED recent window (server-side — the chart
// just receives a plain array). Weeks with no submissions are included as 0,
// so the chart reads as a timeline even while the board is young.
const WEEKS_SHOWN = 8;
function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function groupByWeek(products) {
  const counts = new Map();
  for (const p of products) {
    const key = mondayOf(p.submitted_at).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const thisMonday = mondayOf(new Date());
  return Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - (WEEKS_SHOWN - 1 - i) * 7);
    const key = d.toISOString().slice(0, 10);
    return {
      week: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      count: counts.get(key) ?? 0,
    };
  });
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="main">
        <section className="section container !pt-6">
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
  const rejected = products.filter((p) => p.status === "rejected");
  const totalClicks = approved.reduce((sum, p) => sum + p.clicks, 0);
  const totalViews = approved.reduce((sum, p) => sum + p.views, 0);
  const ctr = totalViews ? Math.round((totalClicks / totalViews) * 100) : null;
  const withDigest = approved.filter((p) => p.review_digest).length;

  // approved products per category (single-series bars; labels carry identity)
  const byCategory = Object.entries(
    approved.reduce(
      (acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }),
      {},
    ),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Products", value: products.length, icon: "uil-box" },
    { label: "Approved", value: approved.length, icon: "uil-check-circle" },
    { label: "Pending", value: pending.length, icon: "uil-clock" },
    { label: "Rejected", value: rejected.length, icon: "uil-times-circle" },
    { label: "Views", value: totalViews, icon: "uil-eye" },
    { label: "Buy clicks", value: totalClicks, icon: "uil-mouse-alt" },
    {
      label: "Click-through",
      value: ctr === null ? "—" : `${ctr}%`,
      icon: "uil-chart-growth",
      hint: "buy clicks ÷ product views",
    },
    {
      label: "AI summaries",
      value: `${withDigest}/${approved.length}`,
      icon: "uil-comments-alt",
      hint: "approved products with a grounded AI summary",
    },
  ];

  return (
    <main className="main">
      <section className="section container !pt-6">
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
              <Card
                key={s.label}
                className="flex items-center gap-3"
                title={s.hint}
              >
                <i className={`uil ${s.icon} text-2xl text-accent`} />
                <div className="min-w-0">
                  <div className="text-2xl font-semibold text-title">
                    {s.value}
                  </div>
                  <div className="text-xs leading-tight text-body-light">
                    {s.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-2 font-semibold text-title">
                <i className="uil uil-chart-bar text-accent" /> Submissions per
                week
                <span className="ml-2 text-xs font-normal text-body-light">
                  last {WEEKS_SHOWN} weeks
                </span>
              </h3>
              <ColumnChart
                data={groupByWeek(products)}
                xKey="week"
                yKey="count"
                label="Submissions"
              />
            </Card>
            <Card>
              <h3 className="mb-2 font-semibold text-title">
                <i className="uil uil-apps text-accent" /> Approved products by
                category
              </h3>
              {byCategory.length ? (
                <TrendingBarChart
                  data={byCategory}
                  valueKey="count"
                  valueLabel="Products"
                />
              ) : (
                <p className="py-6 text-center text-sm text-body-light">
                  Approve products to see the category mix.
                </p>
              )}
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-title">
              <i className="uil uil-chart-growth text-accent" /> Engagement per
              product
              <span className="ml-2 text-xs font-normal text-body-light">
                views → buy clicks → click-through
              </span>
            </h3>
            <EngagementTable products={approved} />
          </Card>

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
              hasKey={hasGeminiKey()}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
