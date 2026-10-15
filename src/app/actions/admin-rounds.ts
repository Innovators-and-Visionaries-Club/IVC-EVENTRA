"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  RoundSchema,
  CriterionSchema,
  UpdateCriterionSchema,
} from "@/lib/validations/admin";
import { z } from "zod";

export type RoundInput = z.infer<typeof RoundSchema>;
export type CriterionInput = z.infer<typeof CriterionSchema>;
export type UpdateCriterionInput = z.infer<typeof UpdateCriterionSchema>;
export type RoundStatus = z.infer<typeof RoundSchema>["status"];

export async function createRound(data: RoundInput) {
  const { user } = await requireAdmin();
  const validated = RoundSchema.parse(data);

  const { data: round, error } = await supabaseAdmin
    .from("evaluation_rounds")
    .insert([validated])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create round: ${error.message}`);
  }

  // Audit log write
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "CREATE_EVALUATION_ROUND",
      entity_type: "evaluation_round",
      entity_id: round.id,
      admin_id: user.id,
      details: {
        title: round.title,
        sequence_order: round.sequence_order,
        status: round.status,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  return round;
}

export async function updateRoundStatus(roundId: string, status: RoundStatus) {
  const { user } = await requireAdmin();
  const validStatus = RoundSchema.shape.status.parse(status);

  // Fetch previous status for diffing
  const { data: previousRound } = await supabaseAdmin
    .from("evaluation_rounds")
    .select("status")
    .eq("id", roundId)
    .single();

  const { data: round, error } = await supabaseAdmin
    .from("evaluation_rounds")
    .update({ status: validStatus, updated_at: new Date().toISOString() })
    .eq("id", roundId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update round status: ${error.message}`);
  }

  // Audit log write
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_ROUND_STATUS",
      entity_type: "evaluation_round",
      entity_id: roundId,
      admin_id: user.id,
      details: {
        previous_status: previousRound?.status || null,
        new_status: validStatus,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  return round;
}

export async function createCriterion(data: CriterionInput) {
  const { user } = await requireAdmin();
  const validated = CriterionSchema.parse(data);

  const { data: criterion, error } = await supabaseAdmin
    .from("evaluation_criteria")
    .insert([validated])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create criterion: ${error.message}`);
  }

  // Audit log write
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "CREATE_CRITERION",
      entity_type: "evaluation_criterion",
      entity_id: criterion.id,
      admin_id: user.id,
      details: {
        round_id: criterion.round_id,
        title: criterion.title,
        max_marks: criterion.max_marks,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  return criterion;
}

export async function updateCriterion(criterionId: string, data: UpdateCriterionInput) {
  const { user } = await requireAdmin();
  const validated = UpdateCriterionSchema.parse(data);

  const { data: criterion, error } = await supabaseAdmin
    .from("evaluation_criteria")
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq("id", criterionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update criterion: ${error.message}`);
  }

  // Audit log write
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_CRITERION",
      entity_type: "evaluation_criterion",
      entity_id: criterionId,
      admin_id: user.id,
      details: validated,
      created_at: new Date().toISOString(),
    },
  ]);

  return criterion;
}

export async function deleteCriterion(criterionId: string) {
  const { user } = await requireAdmin();

  const { error } = await supabaseAdmin
    .from("evaluation_criteria")
    .delete()
    .eq("id", criterionId);

  if (error) {
    throw new Error(`Failed to delete criterion: ${error.message}`);
  }

  // Audit log write
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "DELETE_CRITERION",
      entity_type: "evaluation_criterion",
      entity_id: criterionId,
      admin_id: user.id,
      details: { criterion_id: criterionId },
      created_at: new Date().toISOString(),
    },
  ]);

  return { success: true };
}

export async function getRoundsData() {
  const fetchRounds = async () => {
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
      rounds: (roundsRes.data || []) as any[],
      criteria: (criteriaRes.data || []) as any[],
    };
  };

  const timeoutPromise = new Promise<{ rounds: any[]; criteria: any[] }>((resolve) =>
    setTimeout(() => resolve({ rounds: [], criteria: [] }), 2500)
  );

  return Promise.race([fetchRounds(), timeoutPromise]);
}
