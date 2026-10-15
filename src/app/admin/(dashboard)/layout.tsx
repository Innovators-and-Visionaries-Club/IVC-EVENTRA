import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminSidebar from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Verify basic Supabase Auth & Admin Profile Role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fast-path metadata check first
  const metaRole =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined);

  let profile: { role?: string } | null = null;
  if (metaRole !== "admin") {
    try {
      const fetchProfile = async () => {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        return data;
      };
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      profile = await Promise.race([fetchProfile(), timeout]);
    } catch {}
  }

  const isAdmin = profile?.role === "admin" || metaRole === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 text-center">
        <div className="glass-panel max-w-md w-full p-8 border border-status-error/40 shadow-2xl relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 border border-status-error flex items-center justify-center">
            <span className="font-heading text-2xl text-status-error">403</span>
          </div>
          <h1 className="font-heading text-2xl text-text-primary uppercase mb-2">Access Denied</h1>
          <p className="font-tech text-text-secondary text-sm mb-6">
            Admin privileges required to access mission control.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-surface-color-light border border-border-color hover:border-accent-secondary font-tech font-bold uppercase tracking-wider text-xs text-text-primary transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 2. Checkpoint Verification: (TEMPORARILY BYPASS FOR TESTING - passcode lock disabled)
  // const cookieStore = await cookies();
  // const isVerified = cookieStore.get("admin_session_verified")?.value === "true";
  // if (!isVerified) {
  //   redirect("/admin/login");
  // }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050508]">
      <AdminSidebar />
      <main
        className="flex-1 p-5 md:p-10 overflow-y-auto"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255, 0, 127, 0.08), transparent 500px), radial-gradient(circle at bottom left, rgba(0, 240, 255, 0.05), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
