import { z } from 'zod';

export const ClauseSchema = z.object({
  clause_type: z.string(),
  risk_level: z.string(),
  clause_text: z.string(),
  language_variant: z.string().default(''), // Changed from optional to required with default
});

export const ContractSchema = z.object({
  jurisdiction: z.string({
    required_error: "Jurisdiction is required",
    invalid_type_error: "Jurisdiction must be a string"
  }).min(1, "Jurisdiction cannot be empty"),
  clauses: z.array(ClauseSchema).optional().default([]),
});

// Type inference
export type Clause = z.infer<typeof ClauseSchema>;
export type Contract = z.infer<typeof ContractSchema>;