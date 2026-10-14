import { Lead, DuplicateCluster } from "./types";

/**
 * Normalizes a website or domain string into a canonical domain.
 * Strips protocols, "www.", common app subdomains, paths, ports, and query parameters.
 */
export function normalizeDomain(rawDomainOrUrl: string): string {
  if (!rawDomainOrUrl) return "";
  let domain = rawDomainOrUrl.trim().toLowerCase();

  // Strip protocol
  domain = domain.replace(/^(https?:\/\/)?/i, "");
  // Strip trailing slashes, paths, and query params
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  // Strip port if present
  domain = domain.split(":")[0];
  // Strip leading www. or standard app subdomains
  domain = domain.replace(/^(www\.|app\.|m\.|platform\.)/i, "");

  return domain;
}

/**
 * Normalizes a company name by removing legal entity identifiers,
 * common SaaS noise words, punctuation, and extraneous spacing.
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return "";
  let clean = name.toLowerCase().trim();

  // Remove legal and common corporate suffixes
  const noisePatterns = [
    /\b(incorporated|inc\.?|llc\.?|ltd\.?|corp\.?|corporation|gmbh|co\.?)\b/gi,
    /\b(technologies|technology|software|systems|solutions|platform|group|labs|app|saas)\b/gi,
    /\b(get|the)\b/gi,
  ];

  for (const pattern of noisePatterns) {
    clean = clean.replace(pattern, " ");
  }

  // Remove punctuation and special characters
  clean = clean.replace(/[^a-z0-9\s]/g, "");
  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Computes the Sørensen-Dice similarity coefficient (0 to 1)
 * between two strings based on bigram overlap.
 */
export function computeStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  bigrams1.forEach((bg) => {
    if (bigrams2.has(bg)) {
      intersection++;
    }
  });

  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

export interface MatchDecision {
  isMatch: boolean;
  confidence: number;
  reason: string;
}

/**
 * Compares two leads and determines if they represent the same company target.
 */
export function evaluateLeadSimilarity(
  leadA: { companyName: string; domain: string },
  leadB: { companyName: string; domain: string }
): MatchDecision {
  const domainA = normalizeDomain(leadA.domain);
  const domainB = normalizeDomain(leadB.domain);

  // Exact normalized domain match
  if (domainA && domainB && domainA === domainB) {
    return {
      isMatch: true,
      confidence: 1.0,
      reason: `Canonical domain match: ${domainA}`,
    };
  }

  // Domain stem matching (e.g. getflowpulse.io vs flowpulse.io)
  const stemA = domainA.replace(/^get/i, "").split(".")[0];
  const stemB = domainB.replace(/^get/i, "").split(".")[0];
  if (stemA && stemB && stemA.length >= 4 && stemA === stemB) {
    return {
      isMatch: true,
      confidence: 0.95,
      reason: `Domain brand match: ${stemA}`,
    };
  }

  // Normalized company name comparison
  const normNameA = normalizeCompanyName(leadA.companyName);
  const normNameB = normalizeCompanyName(leadB.companyName);

  if (normNameA && normNameB && normNameA === normNameB) {
    return {
      isMatch: true,
      confidence: 0.92,
      reason: `Identical normalized company name: "${normNameA}"`,
    };
  }

  // Fuzzy bigram similarity
  const similarity = computeStringSimilarity(normNameA, normNameB);
  if (similarity >= 0.82) {
    return {
      isMatch: true,
      confidence: Math.round(similarity * 100) / 100,
      reason: `Fuzzy name similarity (${Math.round(similarity * 100)}% match): "${leadA.companyName}" vs "${leadB.companyName}"`,
    };
  }

  return {
    isMatch: false,
    confidence: Math.round(similarity * 100) / 100,
    reason: "Distinct entities",
  };
}

/**
 * Scans a list of leads and groups potential duplicates into clusters.
 */
export function findDuplicateClusters(leads: Lead[]): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < leads.length; i++) {
    const leadA = leads[i];
    if (processedIds.has(leadA.id) || leadA.mergeStatus === "MERGED") continue;

    const matchedDuplicates: { lead: Lead; confidence: number; matchReason: string }[] = [];

    for (let j = i + 1; j < leads.length; j++) {
      const leadB = leads[j];
      if (processedIds.has(leadB.id) || leadB.mergeStatus === "MERGED") continue;

      const evalResult = evaluateLeadSimilarity(leadA, leadB);
      if (evalResult.isMatch) {
        matchedDuplicates.push({
          lead: leadB,
          confidence: evalResult.confidence,
          matchReason: evalResult.reason,
        });
        processedIds.add(leadB.id);
      }
    }

    if (matchedDuplicates.length > 0) {
      processedIds.add(leadA.id);
      clusters.push({
        primaryLead: leadA,
        duplicates: matchedDuplicates,
      });
    }
  }

  return clusters;
}

/**
 * Merges a duplicate lead into a primary lead record.
 * Selects the highest quality fields while retaining primary identity.
 */
export function mergeLeads(
  primary: Lead,
  duplicate: Lead,
  overrides?: Partial<Lead>
): { mergedPrimary: Lead; updatedDuplicate: Lead } {
  // Contact quality preference: prefer named founder over generic inbox
  const useDuplicateContact =
    primary.contactType === "GENERIC_INBOX" &&
    (duplicate.contactType === "FOUNDER" || duplicate.contactType === "C_LEVEL");

  // Merge tech stacks uniquely
  const mergedTech = Array.from(new Set([...primary.techStack, ...duplicate.techStack]));

  const mergedPrimary: Lead = {
    ...primary,
    contactName: useDuplicateContact ? duplicate.contactName : primary.contactName,
    contactTitle: useDuplicateContact ? duplicate.contactTitle : primary.contactTitle,
    contactEmail: useDuplicateContact ? duplicate.contactEmail : primary.contactEmail,
    contactType: useDuplicateContact ? duplicate.contactType : primary.contactType,
    techStack: mergedTech,
    // Take the best validated email status if available
    emailStatus: primary.emailStatus === "VALID" ? primary.emailStatus : duplicate.emailStatus,
    mxValid: primary.mxValid || duplicate.mxValid,
    description: primary.description || duplicate.description,
    estimatedArrMax: Math.max(primary.estimatedArrMax || 0, duplicate.estimatedArrMax || 0) || null,
    mergeRationale: `Merged with duplicate ${duplicate.companyName} (${duplicate.domain})`,
    ...overrides,
  };

  const updatedDuplicate: Lead = {
    ...duplicate,
    mergeStatus: "MERGED",
    duplicateOfId: primary.id,
    mergeConfidence: 0.95,
    mergeRationale: `Merged into primary target ${primary.companyName} (${primary.domain})`,
  };

  return { mergedPrimary, updatedDuplicate };
}
