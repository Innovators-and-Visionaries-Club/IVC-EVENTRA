import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireOperationsRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Authentication required");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "staff", "organizer"].includes((profile as { role?: string }).role || "")) {
    throw new Error("Forbidden: Operational staff privileges required");
  }

  return { user, profile };
}
