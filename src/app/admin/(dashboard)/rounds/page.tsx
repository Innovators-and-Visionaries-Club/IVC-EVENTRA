import { supabaseAdmin } from "@/lib/supabase/admin";
import RoundsClientView, {
  AdminRoundItem,
  AdminCriterionItem,
} from "./rounds-client";

export const dynamic = "force-dynamic";

export default async function AdminRoundsPage() {
  let rounds: AdminRoundItem[] = [];
  let criteria: AdminCriterionItem[] = [];

  try {
    const [roundsRes, criteriaRes] = await Promise.all([
      supabaseAdmin
        .from("evaluation_rounds")
        .select("*")
        .order("sequence_order", { ascending: true }),
      supabaseAdmin
        .from("evaluation_criteria")
        .select("*"),
    ]);

    if (roundsRes.data) rounds = roundsRes.data;
    if (criteriaRes.data) criteria = criteriaRes.data;
  } catch (err) {
    console.error("Failed to load rounds/criteria data:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-border-color pb-6">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
          Administration // Evaluation Scheme
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          Rounds & Criteria
        </h1>
        <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
          Configure progression stages, rubric scoring bounds, and open/close status of judging rounds.
        </p>
      </div>

      <RoundsClientView initialRounds={rounds} initialCriteria={criteria} />
    </div>
  );
}
