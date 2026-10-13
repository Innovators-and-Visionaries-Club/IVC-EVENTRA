"use server";

import { requireOperationsRole } from "@/lib/auth/operations";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ScanActionSchema,
  type ScanActionInput,
} from "@/lib/validations/operations";

export async function recordMemberAction(data: ScanActionInput) {
  const { user } = await requireOperationsRole();
  const validated = ScanActionSchema.parse(data);

  // 1. Duplicate check in event_activity_logs
  const { data: existingRecord, error: checkError } = await supabaseAdmin
    .from("event_activity_logs")
    .select("id, created_at")
    .eq("participant_id", validated.participant_id)
    .eq("action_type", validated.action_type)
    .maybeSingle();

  if (checkError) {
    console.warn("Activity check query notice:", checkError.message);
  }

  if (existingRecord) {
    throw new Error(
      `Participant has already claimed "${validated.action_type.toUpperCase()}". Duplicate distribution blocked.`
    );
  }

  // 2. Insert activity log
  const { data: record, error: insertError } = await supabaseAdmin
    .from("event_activity_logs")
    .insert([
      {
        team_id: validated.team_id,
        participant_id: validated.participant_id,
        action_type: validated.action_type,
        scanned_by: user.id,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to record scan action: ${insertError.message}`);
  }

  return { success: true, record };
}

export async function fetchTeamMembersForScan(teamId: string) {
  await requireOperationsRole();

  if (!teamId) {
    throw new Error("A valid team identifier is required");
  }

  // 1. Fetch team details
  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id, name, track, leader_name")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    throw new Error(`Team not found: ${teamError?.message || "Invalid team ID"}`);
  }

  // 2. Fetch team participants/members with profiles join
  const { data: rawMembers, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select(`
      id,
      user_id,
      role,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq("team_id", teamId);

  if (membersError) {
    console.warn("Notice: Falling back to direct team_members query:", membersError.message);
  }

  interface RawMember {
    id: string;
    user_id: string;
    role?: string | null;
    name?: string | null;
    email?: string | null;
    profiles?: { full_name?: string | null; email?: string | null } | null;
  }

  const members = ((rawMembers as unknown as RawMember[]) || []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role || "member",
    name: m.profiles?.full_name || m.name || "Member",
    email: m.profiles?.email || m.email || "",
  }));

  // 3. Fetch activity logs for this team
  const { data: logs, error: logsError } = await supabaseAdmin
    .from("event_activity_logs")
    .select("participant_id, action_type, created_at")
    .eq("team_id", teamId);

  if (logsError) {
    console.warn("Activity logs query notice:", logsError.message);
  }

  return {
    team,
    members: members || [],
    activityLogs: logs || [],
  };
}
