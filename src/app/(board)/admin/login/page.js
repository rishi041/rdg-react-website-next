import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import LoginForm from "@/features/admin/components/LoginForm";

export const metadata = { title: "Admin login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isSupabaseConfigured()) redirect("/admin"); // shows the setup notice

  // Already signed in? Straight to the dashboard.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <main className="main">
      <section className="section container !pt-6">
        <h2 className="section__title">Admin</h2>
        <span className="section__subtitle">Sign in to manage products</span>
        <div className="pt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
