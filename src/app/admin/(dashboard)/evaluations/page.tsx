import { supabaseAdmin } from "@/lib/supabase/admin";
import EvaluationsClientView, {
  EvaluationItem,
  RoundItem,
} from "./evaluations-client";

export const dynamic = "force-dynamic";

export default async function AdminEvaluationsPage() {
  let evaluations: EvaluationItem[] = [];
  let rounds: RoundItem[] = [];

  try {
    const [evalsRes, roundsRes] = await Promise.all([
      supabaseAdmin
        .from("evaluations")
        .select(`
          id,
          total_score,
          status,
          created_at,
          updated_at,
          round_id,
          judge_id,
          team_id
        `)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("evaluation_rounds")
        .select("id, title")
        .order("sequence_order", { ascending: true }),
    ]);

    if (evalsRes.data) evaluations = evalsRes.data;
    if (roundsRes.data) rounds = roundsRes.data;
  } catch (err) {
    console.error("Failed to load evaluation records:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-border-color pb-6">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
          Administration // Monitoring & Governance
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          Evaluation Monitor
        </h1>
        <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
          Filter judge evaluations in real-time, inspect marks, and perform audited status overrides.
        </p>
      </div>

      <EvaluationsClientView initialEvaluations={evaluations} rounds={rounds} />
    </div>
  );
}
