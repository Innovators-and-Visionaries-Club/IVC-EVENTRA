"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { EvaluationOverrideSchema } from "@/lib/validations/admin";
import { z } from "zod";

export type EvaluationOverrideInput = z.infer<typeof EvaluationOverrideSchema>;

export async function overrideEvaluationStatus(data: EvaluationOverrideInput) {
  const { user } = await requireAdmin();
  const validated = EvaluationOverrideSchema.parse(data);

  // 1. Fetch current evaluation record for audit diffing
  const { data: previousEvaluation, error: fetchError } = await supabaseAdmin
    .from("evaluations")
    .select("*")
    .eq("id", validated.evaluation_id)
    .single();

  if (fetchError || !previousEvaluation) {
    throw new Error(`Evaluation not found: ${fetchError?.message || "Invalid ID"}`);
  }

  // 2. Update evaluation status
  const { data: updatedEvaluation, error: updateError } = await supabaseAdmin
    .from("evaluations")
    .update({
      status: validated.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validated.evaluation_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update evaluation status: ${updateError.message}`);
  }

  // 3. Log action in audit_logs
  const { error: auditError } = await supabaseAdmin.from("audit_logs").insert([
    {
      action: "EVALUATION_STATUS_OVERRIDE",
      entity_type: "evaluation",
      entity_id: validated.evaluation_id,
      admin_id: user.id,
      details: {
        previous_status: previousEvaluation.status,
        new_status: validated.status,
        reason: validated.reason,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  if (auditError) {
    console.error(`Audit log creation warning: ${auditError.message}`);
  }

  return { evaluation: updatedEvaluation, success: true };
}
