import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import TeamHeader from "@/components/team/Header";

export const dynamic = "force-dynamic";

export default async function TeamLayout({
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
    .single();

  if (!profile || (profile as { role?: string }).role !== "participant") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#050508] text-text-primary flex flex-col">
      <TeamHeader />
      <main
        className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0, 240, 255, 0.04), transparent 500px), radial-gradient(circle at bottom left, rgba(255, 0, 127, 0.04), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
