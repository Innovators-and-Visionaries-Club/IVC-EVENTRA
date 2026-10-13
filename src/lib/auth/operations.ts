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
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string | undefined);
  if (!role || !["admin", "staff", "organizer"].includes(role)) {
    throw new Error("Forbidden: Operational staff privileges required");
  }

  return { user, profile };
}
