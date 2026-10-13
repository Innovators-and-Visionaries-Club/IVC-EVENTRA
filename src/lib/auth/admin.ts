import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Authentication required");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile as { role?: string }).role !== "admin") {
    throw new Error("Forbidden: Admin privileges required");
  }

  // Verify admin session checkpoint cookie (TEMPORARILY BYPASS FOR TESTING - passcode lock disabled)
  // const cookieStore = await cookies();
  // const isPasscodeVerified = cookieStore.get("admin_session_verified")?.value === "true";
  // if (!isPasscodeVerified) {
  //   throw new Error("CheckpointRequired: Admin passcode verification required");
  // }

  return { user, profile };
}
