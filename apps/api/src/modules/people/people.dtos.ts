// @ts-nocheck
import { z } from "zod";

export const createCompetencySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  proficiencyLevels: z.array(z.unknown()).default([]),
});

export const createSuccessionPlanSchema = z.object({
  positionTitle: z.string().min(1),
  currentIncumbentId: z.string().optional(),
  readinessRating: z.string().optional(),
  successors: z.array(z.unknown()).default([]),
  riskOfLoss: z.string().optional(),
  impactOfLoss: z.string().optional(),
  notes: z.string().optional(),
});
