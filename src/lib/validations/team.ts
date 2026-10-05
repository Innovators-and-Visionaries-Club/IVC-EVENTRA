import { z } from "zod";

export const TeamSubmissionSchema = z.object({
  team_id: z.string().uuid(),
  round_id: z.string().uuid(),
  ppt_url: z.string().url("A valid Presentation (PPT) URL is required"),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  pitch_deck_url: z.string().url("Invalid Pitch Deck URL").optional().or(z.literal("")),
  prototype_url: z.string().url("Invalid Prototype URL").optional().or(z.literal("")),
  additional_material_url: z.string().url("Invalid Material URL").optional().or(z.literal("")),
});

export type TeamSubmissionInput = z.infer<typeof TeamSubmissionSchema>;
