import { supabaseAdmin } from "@/lib/supabase/admin";
import EvaluateClientView, {
  TeamDetail,
  SubmissionDetail,
  ActiveRoundDetail,
  CriterionDetail,
  ExistingEvaluationDetail,
} from "./evaluate-client";

export const dynamic = "force-dynamic";

export default async function EvaluateTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  let team: TeamDetail | null = null;
  let submission: SubmissionDetail | null = null;
  let activeRound: ActiveRoundDetail | null = null;
  let criteria: CriterionDetail[] = [];
  let existingEvaluation: ExistingEvaluationDetail | null = null;

  try {
    const [teamRes, subRes, roundRes] = await Promise.all([
      supabaseAdmin.from("teams").select("*").eq("id", teamId).single(),
      supabaseAdmin.from("team_submissions").select("*").eq("team_id", teamId).maybeSingle(),
      supabaseAdmin
        .from("evaluation_rounds")
        .select("*")
        .in("status", ["open", "reopened"])
        .order("sequence_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (teamRes.data) team = teamRes.data;
    if (subRes.data) submission = subRes.data;
    if (roundRes.data) {
      const currentRound = roundRes.data;
      activeRound = currentRound;

      const [critRes, evalRes] = await Promise.all([
        supabaseAdmin
          .from("evaluation_criteria")
          .select("*")
          .eq("round_id", currentRound.id),
        supabaseAdmin
          .from("evaluations")
          .select("*")
          .eq("round_id", currentRound.id)
          .eq("team_id", teamId)
          .maybeSingle(),
      ]);

      if (critRes.data) criteria = critRes.data;
      if (evalRes.data) existingEvaluation = evalRes.data;
    }
  } catch (err) {
    console.error("Failed to load evaluation context:", err);
  }

  return (
    <EvaluateClientView
      teamId={teamId}
      team={team}
      submission={submission}
      activeRound={activeRound}
      criteria={criteria}
      existingEvaluation={existingEvaluation}
    />
  );
}
