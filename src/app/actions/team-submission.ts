"use server";

import { requireTeamLeader } from "@/lib/auth/team";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  TeamSubmissionSchema,
  type TeamSubmissionInput,
} from "@/lib/validations/team";

export async function upsertTeamSubmission(data: TeamSubmissionInput) {
  // 1. Authorize: user must be team leader of this specific team
  await requireTeamLeader(data.team_id);

  // 2. Validate input format
  const validated = TeamSubmissionSchema.parse(data);

  // 3. Verify target round is active and not closed/locked
  const { data: round, error: roundError } = await supabaseAdmin
    .from("evaluation_rounds")
    .select("id, title, status")
    .eq("id", validated.round_id)
    .single();

  if (roundError || !round) {
    throw new Error(`Round not found: ${roundError?.message || "Invalid round ID"}`);
  }

  if (round.status === "closed" || round.status === "locked") {
    throw new Error(
      `Deliverable submissions for round "${round.title}" are locked (${round.status.toUpperCase()}).`
    );
  }

  // 4. Upsert into team_submissions table
  const { data: submission, error: subError } = await supabaseAdmin
    .from("team_submissions")
    .upsert(
      {
        team_id: validated.team_id,
        round_id: validated.round_id,
        ppt_url: validated.ppt_url,
        github_url: validated.github_url || null,
        pitch_deck_url: validated.pitch_deck_url || null,
        prototype_url: validated.prototype_url || null,
        additional_material_url: validated.additional_material_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,round_id" }
    )
    .select()
    .single();

  if (subError) {
    throw new Error(`Failed to save team submission: ${subError.message}`);
  }

  return { submission, success: true };
}
