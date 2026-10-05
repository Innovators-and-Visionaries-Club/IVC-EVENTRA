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

  // 2. Fetch team participants/members
  const { data: members, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("id, user_id, name, role, email")
    .eq("team_id", teamId);

  if (membersError) {
    throw new Error(`Failed to fetch team members: ${membersError.message}`);
  }

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
