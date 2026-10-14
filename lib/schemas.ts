import { z } from "zod";

export const LeadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(500).default(25),
  search: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  categories: z.preprocess((val) => (typeof val === "string" ? val.split(",") : val), z.array(z.string()).optional()),
  contactTypes: z.preprocess((val) => (typeof val === "string" ? val.split(",") : val), z.array(z.string()).optional()),
  websiteStatuses: z.preprocess((val) => (typeof val === "string" ? val.split(",") : val), z.array(z.string()).optional()),
  minTeamSize: z.coerce.number().int().min(0).optional(),
  maxTeamSize: z.coerce.number().int().min(0).optional(),
  hideDuplicates: z.preprocess((val) => val === "true" || val === true, z.boolean().default(true)),
  sortBy: z.enum(["score", "teamSize", "arr", "age", "name"]).default("score"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // Custom Scoring Weights (live sliders)
  categoryWeight: z.coerce.number().min(0).max(100).optional(),
  teamSizeWeight: z.coerce.number().min(0).max(100).optional(),
  companyAgeWeight: z.coerce.number().min(0).max(100).optional(),
  revenueWeight: z.coerce.number().min(0).max(100).optional(),
  contactWeight: z.coerce.number().min(0).max(100).optional(),
  healthTechWeight: z.coerce.number().min(0).max(100).optional(),
});

export const LeadCreateSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  domain: z.string().min(1, "Domain is required"),
  websiteUrl: z.string().url().optional(),
  category: z.string().default("B2B Workflow"),
  description: z.string().optional(),
  estimatedTeamSize: z.coerce.number().int().positive().default(10),
  foundedYear: z.coerce.number().int().min(1980).max(2026).default(2018),
  estimatedArrMin: z.coerce.number().nullable().optional(),
  estimatedArrMax: z.coerce.number().nullable().optional(),
  arrHintString: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactType: z.enum(["FOUNDER", "C_LEVEL", "VP_DIRECTOR", "GENERIC_INBOX", "UNKNOWN"]).default("UNKNOWN"),
});

export const MergeRequestSchema = z.object({
  primaryId: z.string().min(1),
  duplicateId: z.string().min(1),
  overrides: z.record(z.string(), z.any()).optional(),
});

export const DismissDuplicateSchema = z.object({
  duplicateId: z.string().min(1),
});

export const BatchValidateSchema = z.object({
  leadIds: z.array(z.string()).min(1),
});

export const ExplainRequestSchema = z.object({
  leadId: z.string().min(1),
});

export const ExportQuerySchema = z.object({
  format: z.enum(["csv", "hubspot"]).default("csv"),
  search: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  categories: z.preprocess((val) => (typeof val === "string" ? val.split(",") : val), z.array(z.string()).optional()),
  hideDuplicates: z.preprocess((val) => val === "true" || val === true, z.boolean().default(true)),
});
