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
  await requireAdmin();
  const validated = RoundSchema.parse(data);

  const { data: round, error } = await supabaseAdmin
    .from("evaluation_rounds")
    .insert([validated])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create round: ${error.message}`);
  }

  return round;
}

export async function updateRoundStatus(roundId: string, status: RoundStatus) {
  await requireAdmin();
  const validStatus = RoundSchema.shape.status.parse(status);

  const { data: round, error } = await supabaseAdmin
    .from("evaluation_rounds")
    .update({ status: validStatus, updated_at: new Date().toISOString() })
    .eq("id", roundId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update round status: ${error.message}`);
  }

  return round;
}

export async function createCriterion(data: CriterionInput) {
  await requireAdmin();
  const validated = CriterionSchema.parse(data);

  const { data: criterion, error } = await supabaseAdmin
    .from("evaluation_criteria")
    .insert([validated])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create criterion: ${error.message}`);
  }

  return criterion;
}

export async function updateCriterion(criterionId: string, data: UpdateCriterionInput) {
  await requireAdmin();
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

  return criterion;
}

export async function deleteCriterion(criterionId: string) {
  await requireAdmin();

  const { error } = await supabaseAdmin
    .from("evaluation_criteria")
    .delete()
    .eq("id", criterionId);

  if (error) {
    throw new Error(`Failed to delete criterion: ${error.message}`);
  }

  return { success: true };
}
