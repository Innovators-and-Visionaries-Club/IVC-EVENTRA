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

  // Fast-path: Check user metadata first to avoid blocking DB query
  const metaRole =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined);
  if (metaRole === "admin") {
    return { user, profile: { role: "admin" } };
  }

  // Fallback: Fetch profile with strict 1.5s timeout
  let profile: { role?: string } | null = null;
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

  const isAdmin = profile?.role === "admin" || metaRole === "admin";

  if (!isAdmin) {
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
