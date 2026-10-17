import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import JudgeSidebar from "@/components/judge/Sidebar";

export const dynamic = "force-dynamic";

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string })?.role || (user.user_metadata?.role as string | undefined);
  if (!role || (role !== "judge" && role !== "admin")) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-[#050508] text-text-primary">
      <JudgeSidebar />
      <main
        className="flex-1 p-6 md:p-10 md:overflow-y-auto overscroll-contain h-full"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(251, 200, 21, 0.04), transparent 500px), radial-gradient(circle at bottom left, rgba(255, 0, 127, 0.04), transparent 500px)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
