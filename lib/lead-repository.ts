import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";
import {
  Lead,
  ScoreBreakdown,
  ScoringWeights,
  DEFAULT_WEIGHTS,
  LeadFilterCriteria,
  DuplicateCluster,
} from "./types";
import {
  evaluateLeadSignals,
  calculateOverallScore,
  generateDeterministicExplanation,
} from "./scoring";
import { normalizeDomain, normalizeCompanyName, findDuplicateClusters, mergeLeads as mergeLogic } from "./dedupe";
import { verifyDomainMx, checkWebsiteHealth, validateEmailSyntax } from "./validation";

let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient | null {
  if (process.env.DATABASE_URL && !prisma) {
    try {
      prisma = new PrismaClient();
    } catch {
      prisma = null;
    }
  }
  return prisma;
}

// In-memory runtime cache of leads to provide instant sub-millisecond recalibrations
// and zero-friction fallback if Postgres is not configured locally.
let memoryLeads: Lead[] = [];
let isInitialized = false;

function hydrateLeadFromRaw(raw: any, id: string, weights: ScoringWeights = DEFAULT_WEIGHTS): Lead {
  const companyName = String(raw["Company Name"] || raw.companyName || "").trim();
  const domain = String(raw["Domain"] || raw.domain || "").trim();
  const normalizedDomain = normalizeDomain(domain);
  const normalizedName = normalizeCompanyName(companyName);
  const category = String(raw["Category"] || raw.category || "B2B Workflow").trim();
  const description = String(raw["Description"] || raw.description || "").trim();

  const teamSize = Number(raw["Estimated Team Size"] || raw.estimatedTeamSize || 10);
  const foundedYear = Number(raw["Founded Year"] || raw.foundedYear || 2018);
  const currentYear = 2026;
  const companyAge = currentYear - foundedYear;

  const estimatedArrMin = raw["Estimated ARR Min"] != null ? Number(raw["Estimated ARR Min"]) : raw.estimatedArrMin != null ? Number(raw.estimatedArrMin) : null;
  const estimatedArrMax = raw["Estimated ARR Max"] != null ? Number(raw["Estimated ARR Max"]) : raw.estimatedArrMax != null ? Number(raw.estimatedArrMax) : null;
  const arrHintString = String(raw["ARR Hint"] || raw.arrHintString || (estimatedArrMin ? `$${(estimatedArrMin / 1000000).toFixed(1)}M ARR` : "Undisclosed"));

  let techStack: string[] = [];
  if (Array.isArray(raw.techStack)) {
    techStack = raw.techStack;
  } else if (typeof raw["Tech Stack"] === "string") {
    techStack = raw["Tech Stack"].split(";").map((s: string) => s.trim());
  } else if (typeof raw.techStack === "string") {
    techStack = raw.techStack.split(";").map((s: string) => s.trim());
  } else {
    techStack = ["React", "PostgreSQL", "Node.js"];
  }

  const contactName = String(raw["Contact Name"] || raw.contactName || "").trim();
  const contactTitle = String(raw["Contact Title"] || raw.contactTitle || "").trim();
  const contactEmail = String(raw["Contact Email"] || raw.contactEmail || "").trim();
  const contactType = (raw["Contact Type"] || raw.contactType || "UNKNOWN") as any;

  const websiteStatus = (raw["Website Status"] || raw.websiteStatus || "ONLINE") as any;
  const httpStatusCode = Number(raw["HTTP Status"] || raw.httpStatusCode || 200);
  const sslValid = raw["SSL Valid"] !== false && raw.sslValid !== false;
  const responseTimeMs = Number(raw["Response Time (ms)"] || raw.responseTimeMs || 250);

  const signals = evaluateLeadSignals({
    category,
    estimatedTeamSize: teamSize,
    companyAge,
    estimatedArrMin,
    estimatedArrMax,
    contactType,
    contactEmail,
    contactName,
    websiteStatus,
    sslValid,
    techStack,
  });

  const overallScore = calculateOverallScore(signals, weights);
  const aiExplanation = raw.aiExplanation || generateDeterministicExplanation(
    {
      companyName,
      category,
      estimatedTeamSize: teamSize,
      companyAge,
      arrHintString,
      contactTitle,
    },
    signals,
    overallScore
  );

  return {
    id,
    companyName,
    normalizedName,
    domain,
    normalizedDomain,
    websiteUrl: String(raw["Website URL"] || raw.websiteUrl || `https://${domain}`),
    category,
    description,
    estimatedTeamSize: teamSize,
    foundedYear,
    companyAge,
    estimatedArrMin,
    estimatedArrMax,
    arrHintString,
    techStack,
    contactName,
    contactTitle,
    contactEmail,
    contactType,
    emailStatus: raw.emailStatus || (validateEmailSyntax(contactEmail) ? "VALID" : "UNCHECKED"),
    mxValid: raw.mxValid ?? true,
    websiteStatus,
    httpStatusCode,
    sslValid,
    responseTimeMs,
    overallScore,
    scoreBreakdown: signals,
    aiExplanation,
    duplicateOfId: raw.duplicateOfId || null,
    mergeStatus: raw.mergeStatus || "ORIGINAL",
    mergeConfidence: raw.mergeConfidence || null,
    mergeRationale: raw.mergeRationale || null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function initLeadsFromCsv(): Lead[] {
  const csvPath = path.resolve(process.cwd(), "data", "seed-leads.csv");
  if (!fs.existsSync(csvPath)) {
    return [];
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const leads: Lead[] = [];
  let index = 1;
  for (const raw of parsed.data as any[]) {
    if (!raw["Domain"] && !raw["Company Name"]) continue;
    leads.push(hydrateLeadFromRaw(raw, `lead-${index++}`));
  }

  return leads;
}

function ensureInitialized() {
  if (!isInitialized || memoryLeads.length === 0) {
    memoryLeads = initLeadsFromCsv();
    isInitialized = true;
  }
}

export const leadRepository = {
  /**
   * Returns all active leads, optionally filtered, weighted, and sorted
   */
  async getLeads(params?: {
    criteria?: LeadFilterCriteria;
    weights?: ScoringWeights;
    page?: number;
    pageSize?: number;
    sortBy?: "score" | "teamSize" | "arr" | "age" | "name";
    sortOrder?: "asc" | "desc";
  }): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    stats: {
      totalLeads: number;
      highFitCount: number;
      mediumFitCount: number;
      lowFitCount: number;
      duplicateCount: number;
      avgScore: number;
    };
  }> {
    ensureInitialized();

    const weights = params?.weights || DEFAULT_WEIGHTS;
    const criteria = params?.criteria || {};
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(1, params?.pageSize || 25);
    const sortBy = params?.sortBy || "score";
    const sortOrder = params?.sortOrder || "desc";

    // Dynamic score recalculation with current weights
    let workingSet = memoryLeads.map((l) => {
      const breakdown = evaluateLeadSignals(l);
      const score = calculateOverallScore(breakdown, weights);
      return {
        ...l,
        overallScore: score,
        scoreBreakdown: breakdown,
      };
    });

    // Global Stats before filter slicing
    const totalLeads = workingSet.length;
    let highFitCount = 0;
    let mediumFitCount = 0;
    let lowFitCount = 0;
    let duplicateCount = 0;
    let scoreSum = 0;

    for (const l of workingSet) {
      if (l.mergeStatus === "MERGED") duplicateCount++;
      if (l.overallScore >= 75) highFitCount++;
      else if (l.overallScore >= 50) mediumFitCount++;
      else lowFitCount++;
      scoreSum += l.overallScore;
    }
    const avgScore = totalLeads > 0 ? Math.round((scoreSum / totalLeads) * 10) / 10 : 0;

    // Apply filtering
    if (criteria.hideDuplicates !== false) {
      workingSet = workingSet.filter((l) => l.mergeStatus !== "MERGED");
    }

    if (criteria.search && criteria.search.trim() !== "") {
      const q = criteria.search.toLowerCase().trim();
      workingSet = workingSet.filter(
        (l) =>
          l.companyName.toLowerCase().includes(q) ||
          l.domain.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.contactEmail.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    if (criteria.minScore != null) {
      workingSet = workingSet.filter((l) => l.overallScore >= criteria.minScore!);
    }
    if (criteria.maxScore != null) {
      workingSet = workingSet.filter((l) => l.overallScore <= criteria.maxScore!);
    }

    if (criteria.categories && criteria.categories.length > 0) {
      const catSet = new Set(criteria.categories);
      workingSet = workingSet.filter((l) => catSet.has(l.category));
    }

    if (criteria.contactTypes && criteria.contactTypes.length > 0) {
      const typeSet = new Set(criteria.contactTypes);
      workingSet = workingSet.filter((l) => typeSet.has(l.contactType));
    }

    if (criteria.websiteStatuses && criteria.websiteStatuses.length > 0) {
      const webSet = new Set(criteria.websiteStatuses);
      workingSet = workingSet.filter((l) => webSet.has(l.websiteStatus));
    }

    if (criteria.minTeamSize != null) {
      workingSet = workingSet.filter((l) => l.estimatedTeamSize >= criteria.minTeamSize!);
    }
    if (criteria.maxTeamSize != null) {
      workingSet = workingSet.filter((l) => l.estimatedTeamSize <= criteria.maxTeamSize!);
    }

    // Sorting
    workingSet.sort((a, b) => {
      let diff = 0;
      if (sortBy === "score") diff = a.overallScore - b.overallScore;
      else if (sortBy === "teamSize") diff = a.estimatedTeamSize - b.estimatedTeamSize;
      else if (sortBy === "arr") diff = (a.estimatedArrMin || 0) - (b.estimatedArrMin || 0);
      else if (sortBy === "age") diff = a.companyAge - b.companyAge;
      else if (sortBy === "name") diff = a.companyName.localeCompare(b.companyName);

      return sortOrder === "desc" ? -diff : diff;
    });

    const total = workingSet.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginatedLeads = workingSet.slice((page - 1) * pageSize, page * pageSize);

    return {
      leads: paginatedLeads,
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalLeads,
        highFitCount,
        mediumFitCount,
        lowFitCount,
        duplicateCount,
        avgScore,
      },
    };
  },

  async getLeadById(id: string): Promise<Lead | null> {
    ensureInitialized();
    const found = memoryLeads.find((l) => l.id === id);
    return found || null;
  },

  async addLeads(newLeads: Partial<Lead>[]): Promise<{ count: number }> {
    ensureInitialized();
    let added = 0;
    for (const raw of newLeads) {
      const id = `lead-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const lead = hydrateLeadFromRaw(raw, id);
      memoryLeads.unshift(lead);
      added++;
    }
    return { count: added };
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    ensureInitialized();
    const index = memoryLeads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const current = memoryLeads[index];
    const updated: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recompute score if signals changed
    const signals = evaluateLeadSignals(updated);
    updated.scoreBreakdown = signals;
    updated.overallScore = calculateOverallScore(signals);

    memoryLeads[index] = updated;
    return updated;
  },

  async getDuplicateClusters(): Promise<DuplicateCluster[]> {
    ensureInitialized();
    return findDuplicateClusters(memoryLeads);
  },

  async executeMerge(primaryId: string, duplicateId: string, overrides?: Partial<Lead>): Promise<{ primary: Lead; duplicate: Lead } | null> {
    ensureInitialized();
    const primary = memoryLeads.find((l) => l.id === primaryId);
    const duplicate = memoryLeads.find((l) => l.id === duplicateId);

    if (!primary || !duplicate) return null;

    const { mergedPrimary, updatedDuplicate } = mergeLogic(primary, duplicate, overrides);

    const pIdx = memoryLeads.findIndex((l) => l.id === primaryId);
    const dIdx = memoryLeads.findIndex((l) => l.id === duplicateId);

    memoryLeads[pIdx] = mergedPrimary;
    memoryLeads[dIdx] = updatedDuplicate;

    return { primary: mergedPrimary, duplicate: updatedDuplicate };
  },

  async dismissDuplicate(duplicateId: string): Promise<Lead | null> {
    ensureInitialized();
    const lead = memoryLeads.find((l) => l.id === duplicateId);
    if (!lead) return null;
    lead.mergeStatus = "DUPLICATE_DISMISSED";
    lead.updatedAt = new Date().toISOString();
    return lead;
  },

  async validateBatch(leadIds: string[]): Promise<{ updatedCount: number }> {
    ensureInitialized();
    let updatedCount = 0;

    for (const id of leadIds) {
      const lead = memoryLeads.find((l) => l.id === id);
      if (!lead) continue;

      // Validate email syntax & MX
      const syntaxValid = validateEmailSyntax(lead.contactEmail);
      if (syntaxValid) {
        const mxPass = await verifyDomainMx(lead.domain);
        lead.mxValid = mxPass;
        lead.emailStatus = mxPass ? "VALID" : "INVALID";
      } else {
        lead.emailStatus = "INVALID";
        lead.mxValid = false;
      }

      // Check website health
      const webHealth = await checkWebsiteHealth(lead.domain);
      lead.websiteStatus = webHealth.websiteStatus;
      lead.httpStatusCode = webHealth.httpStatusCode;
      lead.sslValid = webHealth.sslValid;
      lead.responseTimeMs = webHealth.responseTimeMs;

      // Recalculate score
      const signals = evaluateLeadSignals(lead);
      lead.scoreBreakdown = signals;
      lead.overallScore = calculateOverallScore(signals);
      lead.updatedAt = new Date().toISOString();
      updatedCount++;
    }

    return { updatedCount };
  },

  async resetToSeed(): Promise<{ count: number }> {
    memoryLeads = initLeadsFromCsv();
    isInitialized = true;
    return { count: memoryLeads.length };
  },
};
