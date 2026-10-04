import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireActiveJudgeForTeam(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Authentication required");
  }

  // Verify user is a judge
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as { role?: string }).role !== "judge") {
    throw new Error("Forbidden: Judge role required");
  }

  // Verify judge is assigned to the target team
  const { data: assignment, error: assignError } = await supabaseAdmin
    .from("judge_assignments")
    .select("id")
    .eq("judge_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (assignError || !assignment) {
    throw new Error("Forbidden: You are not assigned to evaluate this team");
  }

  return { user, profile };
}

export async function requireJudge() {
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

  if (!profile || (profile as { role?: string }).role !== "judge") {
    throw new Error("Forbidden: Judge role required");
  }

  return { user, profile };
}
