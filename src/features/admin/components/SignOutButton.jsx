"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" onClick={handleSignOut} className="!py-2 text-sm">
      Sign out <i className="uil uil-signout" />
    </Button>
  );
}
