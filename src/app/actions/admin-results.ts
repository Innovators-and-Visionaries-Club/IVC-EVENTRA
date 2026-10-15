"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ResultActionSchema } from "@/lib/validations/admin";
import { z } from "zod";

export type ResultActionInput = z.infer<typeof ResultActionSchema>;

export async function triggerResultsEngine(data: ResultActionInput) {
  const { user } = await requireAdmin();
  const validated = ResultActionSchema.parse(data);

  if (validated.action === "recalculate") {
    // 1. Fetch evaluations associated with this event (via round_id or direct)
    const { data: rounds } = await supabaseAdmin
      .from("evaluation_rounds")
      .select("id")
      .eq("event_id", validated.event_id);

    const roundIds = (rounds || []).map((r) => r.id);

    let evalQuery = supabaseAdmin
      .from("evaluations")
      .select("team_id, total_score, status")
      .in("status", ["submitted", "locked"]);

    if (roundIds.length > 0) {
      evalQuery = evalQuery.in("round_id", roundIds);
    }

    const { data: evaluations, error: evalError } = await evalQuery;

    if (evalError) {
      throw new Error(`Failed to fetch evaluations for recalculation: ${evalError.message}`);
    }

    // 2. Aggregate total scores grouped by team_id
    const teamScoreMap = new Map<string, { totalScore: number; count: number }>();

    for (const ev of evaluations || []) {
      if (!ev.team_id) continue;
      const current = teamScoreMap.get(ev.team_id) || { totalScore: 0, count: 0 };
      teamScoreMap.set(ev.team_id, {
        totalScore: current.totalScore + (Number(ev.total_score) || 0),
        count: current.count + 1,
      });
    }

    // 3. Upsert results per team
    const updates = Array.from(teamScoreMap.entries()).map(([team_id, stat]) => ({
      event_id: validated.event_id,
      team_id,
      total_score: stat.totalScore,
      average_score: stat.count > 0 ? stat.totalScore / stat.count : 0,
      evaluations_count: stat.count,
      updated_at: new Date().toISOString(),
    }));

    if (updates.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("event_results")
        .upsert(updates, { onConflict: "event_id,team_id" });

      if (upsertError) {
        throw new Error(`Failed to upsert event results: ${upsertError.message}`);
      }
    }
  } else if (validated.action === "publish") {
    // Toggle published state
    const { error: publishError } = await supabaseAdmin
      .from("event_results")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", validated.event_id);

    if (publishError) {
      throw new Error(`Failed to publish event results: ${publishError.message}`);
    }
  } else if (validated.action === "lock") {
    // Lock results against further modification
    const { error: lockError } = await supabaseAdmin
      .from("event_results")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", validated.event_id);

    if (lockError) {
      throw new Error(`Failed to lock event results: ${lockError.message}`);
    }
  }

  // Record action in audit_logs
  const { error: auditError } = await supabaseAdmin.from("audit_logs").insert([
    {
      action: `RESULTS_ENGINE_${validated.action.toUpperCase()}`,
      entity_type: "event_results",
      entity_id: validated.event_id,
      admin_id: user.id,
      details: {
        action: validated.action,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    },
  ]);

  if (auditError) {
    console.error(`Audit log creation warning: ${auditError.message}`);
  }

  return { success: true, action: validated.action, event_id: validated.event_id };
}

export async function getResultsData() {
  const fetchResults = async () => {
    const { data } = await supabaseAdmin
      .from("event_results")
      .select("*")
      .order("total_score", { ascending: false });
    return (data || []) as any[];
  };

  const timeoutPromise = new Promise<any[]>((resolve) =>
    setTimeout(() => resolve([]), 2500)
  );

  return Promise.race([fetchResults(), timeoutPromise]);
}
