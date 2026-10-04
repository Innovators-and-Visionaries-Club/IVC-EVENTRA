import { supabaseAdmin } from "@/lib/supabase/admin";
import EvaluateClientView from "./evaluate-client";

export const dynamic = "force-dynamic";

export default async function EvaluateTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  let team: any = null;
  let submission: any = null;
  let activeRound: any = null;
  let criteria: any[] = [];
  let existingEvaluation: any = null;

  try {
    const [teamRes, subRes, roundRes] = await Promise.all([
      supabaseAdmin.from("teams").select("*").eq("id", teamId).single(),
      supabaseAdmin.from("submissions").select("*").eq("team_id", teamId).maybeSingle(),
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
      activeRound = roundRes.data;

      const [critRes, evalRes] = await Promise.all([
        supabaseAdmin
          .from("evaluation_criteria")
          .select("*")
          .eq("round_id", activeRound.id),
        supabaseAdmin
          .from("evaluations")
          .select("*")
          .eq("round_id", activeRound.id)
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
