import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireActiveJudgeForTeam(teamId: string) {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  let user = sessionData?.session?.user;

  if (!user) {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error("Unauthorized: Authentication required");
    }
    user = userData.user;
  }

  const metaRole =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined);

  let isJudge = metaRole === "judge" || metaRole === "admin";
  let profile: { role?: string } | null = null;

  if (!isJudge) {
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileData;
    isJudge = profile?.role === "judge" || profile?.role === "admin";
  }

  if (!isJudge) {
    throw new Error("Forbidden: Judge role required");
  }

  // Admins can evaluate any team; judges must be in judge_assignments
  if (metaRole !== "admin" && profile?.role !== "admin") {
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from("judge_assignments")
      .select("id")
      .eq("judge_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (assignError || !assignment) {
      throw new Error("Forbidden: You are not assigned to evaluate this team");
    }
  }

  return { user, profile };
}

export async function requireJudge() {
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  let user = sessionData?.session?.user;

  if (!user) {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error("Unauthorized: Authentication required");
    }
    user = userData.user;
  }

  const metaRole =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined);

  if (metaRole === "judge" || metaRole === "admin") {
    return { user, profile: { role: metaRole } };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "judge" && profile?.role !== "admin") {
    throw new Error("Forbidden: Judge role required");
  }

  return { user, profile };
}

export const requireJudgeAuth = requireJudge;
