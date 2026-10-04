import { z } from "zod";

export const ScoreItemSchema = z.object({
  criterion_id: z.string().uuid(),
  score: z.number().min(0, "Score cannot be negative"),
});

export const SubmitEvaluationSchema = z.object({
  round_id: z.string().uuid(),
  team_id: z.string().uuid(),
  scores: z.array(ScoreItemSchema).min(1, "At least one criterion score is required"),
  feedback: z.string().optional(),
  is_draft: z.boolean().default(false),
});

export type ScoreItemInput = z.infer<typeof ScoreItemSchema>;
export type SubmitEvaluationInput = z.infer<typeof SubmitEvaluationSchema>;
