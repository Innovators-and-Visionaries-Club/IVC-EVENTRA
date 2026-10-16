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
    const fetchRoundsData = async () => {
      const [roundsRes, criteriaRes] = await Promise.all([
        supabaseAdmin
          .from("evaluation_rounds")
          .select("*")
          .order("sequence_order", { ascending: true }),
        supabaseAdmin
          .from("evaluation_criteria")
          .select("*"),
      ]);
      return {
        rounds: roundsRes.data || [],
        criteria: criteriaRes.data || [],
      };
    };

    const timeoutPromise = new Promise<{ rounds: AdminRoundItem[]; criteria: AdminCriterionItem[] }>(
      (resolve) => setTimeout(() => resolve({ rounds: [], criteria: [] }), 2500)
    );

    const data = await Promise.race([fetchRoundsData(), timeoutPromise]);
    rounds = data.rounds;
    criteria = data.criteria;
  } catch (err) {
    console.error("Failed to load rounds/criteria data:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <RoundsClientView initialRounds={rounds} initialCriteria={criteria} />
    </div>
  );
}
