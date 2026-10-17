"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { requireOperationsRole } from "@/lib/auth/operations";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface JudgeOption {
  id: string;
  full_name: string | null;
  email: string | null;
  assigned_team_ids: string[];
}

export interface TeamOption {
  id: string;
  name: string;
  code?: string | null;
  track?: string | null;
  assigned_judge_ids: string[];
  assigned_judge_names?: string[];
}

export interface JudgeAssignmentsData {
  judges: JudgeOption[];
  teams: TeamOption[];
}

export async function getJudgeAssignmentsData(): Promise<JudgeAssignmentsData> {
  try {
    // Accessible by admins as well as operational staff / club members
    await requireOperationsRole();
  } catch {
    try {
      await requireAdmin();
    } catch (err) {
      console.warn("getJudgeAssignmentsData auth notice:", err);
      return { judges: [], teams: [] };
    }
  }

  const fetchData = async (): Promise<JudgeAssignmentsData> => {
    const [judgesRes, teamsRes, assignmentsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "judge")
        .order("full_name", { ascending: true }),
      supabaseAdmin
        .from("teams")
        .select("id, name, code, track")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("judge_assignments")
        .select("judge_id, team_id"),
    ]);

    const assignments = assignmentsRes.data || [];

    // Map judge -> array of team_ids
    const judgeToTeams = new Map<string, string[]>();
    // Map team -> array of judge_ids
    const teamToJudges = new Map<string, string[]>();

    for (const a of assignments) {
      if (!judgeToTeams.has(a.judge_id)) judgeToTeams.set(a.judge_id, []);
      judgeToTeams.get(a.judge_id)!.push(a.team_id);

      if (!teamToJudges.has(a.team_id)) teamToJudges.set(a.team_id, []);
      teamToJudges.get(a.team_id)!.push(a.judge_id);
    }

    const judgeNameMap = new Map<string, string>();
    (judgesRes.data || []).forEach((j) => {
      judgeNameMap.set(j.id, j.full_name || j.email || "Judge");
    });

    const judges: JudgeOption[] = (judgesRes.data || []).map((j) => ({
      id: j.id,
      full_name: j.full_name,
      email: j.email,
      assigned_team_ids: judgeToTeams.get(j.id) || [],
    }));

    const teams: TeamOption[] = (teamsRes.data || []).map((t) => {
      const jIds = teamToJudges.get(t.id) || [];
      return {
        id: t.id,
        name: t.name,
        code: t.code,
        track: t.track,
        assigned_judge_ids: jIds,
        assigned_judge_names: jIds.map((id) => judgeNameMap.get(id) || "Judge"),
      };
    });

    return { judges, teams };
  };

  const timeoutPromise = new Promise<JudgeAssignmentsData>((resolve) =>
    setTimeout(() => resolve({ judges: [], teams: [] }), 3000)
  );

  return Promise.race([fetchData(), timeoutPromise]);
}

export async function updateJudgeTeams(data: {
  judgeId: string;
  teamIds: string[];
}) {
  const { user } = await requireAdmin();

  // 1. Delete all existing assignments for this judge
  const { error: deleteError } = await supabaseAdmin
    .from("judge_assignments")
    .delete()
    .eq("judge_id", data.judgeId);

  if (deleteError) {
    throw new Error(`Failed to reset existing judge assignments: ${deleteError.message}`);
  }

  // 2. Insert new assignments if any
  if (data.teamIds.length > 0) {
    const rows = data.teamIds.map((tId) => ({
      judge_id: data.judgeId,
      team_id: tId,
      assigned_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from("judge_assignments")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to save judge assignments: ${insertError.message}`);
    }
  }

  // 3. Audit log write (non-blocking)
  void supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_JUDGE_ASSIGNMENTS",
      entity_type: "judge_assignments",
      entity_id: data.judgeId,
      admin_id: user.id,
      details: {
        judge_id: data.judgeId,
        team_ids: data.teamIds,
        assigned_count: data.teamIds.length,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/users");
  revalidatePath("/judge");

  return { success: true };
}

export async function toggleSingleAssignment(data: {
  judgeId: string;
  teamId: string;
  assign: boolean;
}) {
  const { user } = await requireAdmin();

  if (data.assign) {
    const { error } = await supabaseAdmin
      .from("judge_assignments")
      .upsert(
        { judge_id: data.judgeId, team_id: data.teamId, assigned_at: new Date().toISOString() },
        { onConflict: "judge_id,team_id" }
      );
    if (error) throw new Error(`Failed to assign team: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin
      .from("judge_assignments")
      .delete()
      .eq("judge_id", data.judgeId)
      .eq("team_id", data.teamId);
    if (error) throw new Error(`Failed to unassign team: ${error.message}`);
  }

  // Audit log (non-blocking)
  void supabaseAdmin.from("audit_logs").insert([
    {
      action: data.assign ? "ASSIGN_TEAM_TO_JUDGE" : "UNASSIGN_TEAM_FROM_JUDGE",
      entity_type: "judge_assignments",
      entity_id: data.judgeId,
      admin_id: user.id,
      details: {
        judge_id: data.judgeId,
        team_id: data.teamId,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/users");
  revalidatePath("/judge");

  return { success: true };
}
