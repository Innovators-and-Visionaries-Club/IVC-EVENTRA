import { createClient } from "@/lib/supabase/client";

export async function getRoleRedirectUrl(userId: string): Promise<string> {
  const supabase = createClient();

  // 1. Fetch user's profile role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return "/";
  }

  const role = (profile as { role?: string }).role;

  switch (role) {
    case "admin":
      return "/admin";
    case "judge":
      return "/judge";
    case "staff":
    case "organizer":
      return "/ops/scanner";
    case "leader":
    case "participant": {
      // Check team membership
      const { data: member } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (member) {
        return "/team/submission";
      }
      return "/participants";
    }
    default:
      return "/";
  }
}
