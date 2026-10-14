import { Lead, ScoreBreakdown, ScoringWeights, DEFAULT_WEIGHTS } from "./types";

/**
 * Calculates the Category Fit sub-score (0 - 100)
 * Evaluates SaaS industry alignment with PE / Search Fund retention profiles.
 */
export function calculateCategoryScore(category: string): number {
  const norm = category.toLowerCase();
  if (norm.includes("vertical")) return 100;
  if (norm.includes("workflow") || norm.includes("b2b")) return 95;
  if (norm.includes("cybersecurity") || norm.includes("regtech") || norm.includes("compliance")) return 90;
  if (norm.includes("devtools") || norm.includes("infra")) return 85;
  if (norm.includes("sales") || norm.includes("martech")) return 70;
  if (norm.includes("consumer") || norm.includes("agency") || norm.includes("utility")) return 35;
  return 60;
}

/**
 * Calculates Team Size Fit sub-score (0 - 100)
 * ETA sweet spot is 5-28 employees: enough operational maturity to transition,
 * without solo-founder key-man risk or big corporate overhead.
 */
export function calculateTeamSizeScore(size: number): number {
  if (size >= 6 && size <= 25) return 100; // Optimal search fund sweet spot
  if (size >= 26 && size <= 45) return 85;  // Strong, slightly higher valuation
  if (size >= 3 && size <= 5) return 65;    // Viable, but key-man risk
  if (size >= 46 && size <= 65) return 50;  // Upper bound for traditional search
  if (size >= 1 && size <= 2) return 35;    // High solo founder transition risk
  return 30; // > 65: Too big/expensive for search fund
}

/**
 * Calculates Company Age sub-score (0 - 100)
 * Sweet spot is 4-9 years: proven product-market fit, sticky customers,
 * and founder fatigue/liquidity readiness.
 */
export function calculateCompanyAgeScore(age: number): number {
  if (age >= 4 && age <= 9) return 100;  // Prime acquisition window
  if (age >= 10 && age <= 14) return 80; // High stability, verify tech debt
  if (age >= 2 && age <= 3) return 60;   // Post-PMF, but young revenue history
  if (age >= 15) return 45;              // Legacy tech stack/stagnation risk
  return 30; // < 2 years: Unproven seed-stage risk
}

/**
 * Calculates Revenue Range Fit sub-score (0 - 100)
 * Search fund sweet spot: $1.0M - $3.0M ARR.
 */
export function calculateRevenueScore(arrMin: number | null, arrMax: number | null): number {
  const avgArr = arrMin && arrMax ? (arrMin + arrMax) / 2 : arrMin || arrMax || 0;

  if (avgArr >= 1000000 && avgArr <= 3000000) return 100; // Search fund sweet spot
  if (avgArr >= 500000 && avgArr < 1000000) return 85;   // Micro-PE / fast close
  if (avgArr > 3000000 && avgArr <= 5000000) return 80;   // Upper search target
  if (avgArr >= 300000 && avgArr < 500000) return 55;    // Emerging
  if (avgArr > 5000000) return 40;                        // Above target fund cap
  if (avgArr > 0 && avgArr < 300000) return 35;          // Sub-scale
  return 50; // Unknown/fallback
}

/**
 * Calculates Contact Quality sub-score (0 - 100)
 * Named Founder / Owner outreach has highest conversion for proprietary deal flow.
 */
export function calculateContactScore(
  contactType: string,
  email: string,
  name: string
): number {
  const isGenericInbox = /^(info|contact|support|hello|team|sales|admin)@/i.test(email || "");
  const normType = contactType.toUpperCase();

  if (normType === "FOUNDER") {
    return isGenericInbox ? 45 : 100;
  }
  if (normType === "C_LEVEL") {
    return isGenericInbox ? 40 : 85;
  }
  if (normType === "VP_DIRECTOR") {
    return isGenericInbox ? 35 : 70;
  }
  if (normType === "GENERIC_INBOX" || isGenericInbox) {
    return name && name !== "General Inquiries" ? 30 : 20;
  }
  return 15;
}

/**
 * Calculates Website Health & Tech Stack sub-score (0 - 100)
 */
export function calculateTechHealthScore(
  websiteStatus: string,
  sslValid: boolean,
  techStack: string[]
): number {
  let healthScore = 0;
  const status = websiteStatus.toUpperCase();
  if (status === "ONLINE" && sslValid) {
    healthScore = 50;
  } else if (status === "ONLINE" || status === "REDIRECT") {
    healthScore = 35;
  } else {
    healthScore = 0;
  }

  let techScore = 0;
  const stackStr = techStack.join(" ").toLowerCase();
  if (
    stackStr.includes("next.js") ||
    stackStr.includes("react") ||
    stackStr.includes("fastapi") ||
    stackStr.includes("node") ||
    stackStr.includes("typescript") ||
    stackStr.includes("postgres") ||
    stackStr.includes("go")
  ) {
    techScore = 50; // Modern maintainable stack
  } else if (stackStr.includes("rails") || stackStr.includes("laravel") || stackStr.includes("django")) {
    techScore = 40; // Mature MVC
  } else if (stackStr.includes("wordpress") || stackStr.includes("jquery") || stackStr.includes("php")) {
    techScore = 20; // Potential legacy maintenance cost
  } else {
    techScore = 35;
  }

  return healthScore + techScore;
}

/**
 * Evaluates all 6 acquisition signals and returns the breakdown
 */
export function evaluateLeadSignals(lead: {
  category: string;
  estimatedTeamSize: number;
  companyAge: number;
  estimatedArrMin: number | null;
  estimatedArrMax: number | null;
  contactType: string;
  contactEmail: string;
  contactName: string;
  websiteStatus: string;
  sslValid: boolean;
  techStack: string[];
}): ScoreBreakdown {
  return {
    categoryScore: calculateCategoryScore(lead.category),
    teamSizeScore: calculateTeamSizeScore(lead.estimatedTeamSize),
    companyAgeScore: calculateCompanyAgeScore(lead.companyAge),
    revenueScore: calculateRevenueScore(lead.estimatedArrMin, lead.estimatedArrMax),
    contactScore: calculateContactScore(lead.contactType, lead.contactEmail, lead.contactName),
    techHealthScore: calculateTechHealthScore(lead.websiteStatus, lead.sslValid, lead.techStack),
  };
}

/**
 * Calculates the overall weighted score (0 - 100) given a breakdown and custom weights
 */
export function calculateOverallScore(
  breakdown: ScoreBreakdown,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const totalWeight =
    (weights.categoryWeight || 0) +
    (weights.teamSizeWeight || 0) +
    (weights.companyAgeWeight || 0) +
    (weights.revenueWeight || 0) +
    (weights.contactWeight || 0) +
    (weights.healthTechWeight || 0);

  if (totalWeight === 0) return 0;

  const weightedSum =
    breakdown.categoryScore * (weights.categoryWeight || 0) +
    breakdown.teamSizeScore * (weights.teamSizeWeight || 0) +
    breakdown.companyAgeScore * (weights.companyAgeWeight || 0) +
    breakdown.revenueScore * (weights.revenueWeight || 0) +
    breakdown.contactScore * (weights.contactWeight || 0) +
    breakdown.techHealthScore * (weights.healthTechWeight || 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Generates an explainable, deterministic rule-based one-sentence summary
 * for PE / ETA buyers when Claude API is unavailable or offline.
 */
export function generateDeterministicExplanation(
  lead: {
    companyName: string;
    category: string;
    estimatedTeamSize: number;
    companyAge: number;
    arrHintString?: string;
    contactTitle?: string;
  },
  breakdown: ScoreBreakdown,
  overallScore: number
): string {
  const strengths: string[] = [];
  const cautions: string[] = [];

  if (breakdown.revenueScore >= 85) strengths.push("ideal ARR sweet-spot");
  else if (breakdown.revenueScore <= 45) cautions.push("sub-scale or out-of-bracket revenue");

  if (breakdown.contactScore >= 85) strengths.push("direct founder contact");
  else if (breakdown.contactScore <= 40) cautions.push("generic inbox routing");

  if (breakdown.categoryScore >= 90) strengths.push(`high-defensibility ${lead.category}`);
  else if (breakdown.categoryScore <= 40) cautions.push(`lower-margin category`);

  if (breakdown.teamSizeScore >= 85) strengths.push(`${lead.estimatedTeamSize}-person team`);
  else if (breakdown.teamSizeScore <= 40) cautions.push(`${lead.estimatedTeamSize}-person team key-man risk`);

  if (breakdown.companyAgeScore >= 90) strengths.push(`${lead.companyAge}y vintage`);
  else if (breakdown.companyAgeScore <= 40) cautions.push(`young ${lead.companyAge}y operating track record`);

  if (overallScore >= 75) {
    const primaryStrength = strengths.slice(0, 2).join(" with ");
    const caveat = cautions.length > 0 ? `, though caution on ${cautions[0]}` : "";
    return `Prime ETA candidate: ${primaryStrength || `${lead.category} target`} and proven acquisition fit (${overallScore}/100)${caveat}.`;
  } else if (overallScore >= 50) {
    const pros = strengths[0] || `${lead.companyAge}y track record`;
    const cons = cautions[0] || "moderate outreach tier";
    return `Moderate acquisition fit: attractive ${pros}, balanced against ${cons} (${overallScore}/100).`;
  } else {
    const primaryDeterrent = cautions.slice(0, 2).join(" and ");
    return `Low acquisition priority: ${primaryDeterrent || "non-core criteria"} limits immediate search fund viability (${overallScore}/100).`;
  }
}
