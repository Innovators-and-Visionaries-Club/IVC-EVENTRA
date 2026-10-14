import { z } from "zod";

export const TeamSubmissionSchema = z.object({
  team_id: z.string().uuid(),
  round_id: z.string().uuid(),
  problem_statement: z.string().min(5, "Problem statement is required (at least 5 characters)"),
  problem_description: z.string().min(10, "Problem description is required (at least 10 characters)"),
  proposed_solution: z.string().min(5, "Proposed solution is required (at least 5 characters)"),
  solution_description: z.string().min(10, "Solution description is required (at least 10 characters)"),
  ppt_url: z.string().min(1, "A presentation file (PPT/PDF/DOCX) is required"),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  pitch_deck_url: z.string().url("Invalid Pitch Deck URL").optional().or(z.literal("")),
  prototype_url: z.string().url("Invalid Prototype URL").optional().or(z.literal("")),
  additional_material_url: z.string().url("Invalid Material URL").optional().or(z.literal("")),
});

export type TeamSubmissionInput = z.infer<typeof TeamSubmissionSchema>;
