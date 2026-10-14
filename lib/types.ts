export type ContactType = "FOUNDER" | "C_LEVEL" | "VP_DIRECTOR" | "GENERIC_INBOX" | "UNKNOWN";

export type ValidationStatus = "VALID" | "INVALID" | "RISKY" | "UNCHECKED";

export type WebsiteStatus = "ONLINE" | "REDIRECT" | "UNREACHABLE" | "TIMEOUT" | "UNCHECKED";

export type MergeStatus = "ORIGINAL" | "MERGED" | "DUPLICATE_DISMISSED";

export interface ScoreBreakdown {
  categoryScore: number;
  teamSizeScore: number;
  companyAgeScore: number;
  revenueScore: number;
  contactScore: number;
  techHealthScore: number;
  weightedScore?: number;
}

export interface ScoringWeights {
  categoryWeight: number;
  teamSizeWeight: number;
  companyAgeWeight: number;
  revenueWeight: number;
  contactWeight: number;
  healthTechWeight: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  categoryWeight: 15,
  teamSizeWeight: 20,
  companyAgeWeight: 15,
  revenueWeight: 20,
  contactWeight: 15,
  healthTechWeight: 15,
};

export interface Lead {
  id: string;
  companyName: string;
  normalizedName: string;
  domain: string;
  normalizedDomain: string;
  websiteUrl: string;
  category: string;
  description: string;
  
  // Acquisition Fit Indicators
  estimatedTeamSize: number;
  foundedYear: number;
  companyAge: number;
  estimatedArrMin: number | null;
  estimatedArrMax: number | null;
  arrHintString: string;
  techStack: string[];
  
  // Contact Quality
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactType: ContactType;
  emailStatus: ValidationStatus;
  mxValid: boolean;
  
  // Website Health
  websiteStatus: WebsiteStatus;
  httpStatusCode: number;
  sslValid: boolean;
  responseTimeMs: number;
  
  // Scoring
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  aiExplanation: string;
  
  // Deduplication & Merge State
  duplicateOfId?: string | null;
  mergeStatus: MergeStatus;
  mergeConfidence?: number | null;
  mergeRationale?: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCluster {
  primaryLead: Lead;
  duplicates: {
    lead: Lead;
    confidence: number;
    matchReason: string;
  }[];
}

export interface LeadFilterCriteria {
  search?: string;
  minScore?: number;
  maxScore?: number;
  categories?: string[];
  contactTypes?: ContactType[];
  websiteStatuses?: WebsiteStatus[];
  minTeamSize?: number;
  maxTeamSize?: number;
  hideDuplicates?: boolean;
}

export interface HubspotLeadExport {
  "Company Domain Name": string;
  "Company Name": string;
  "Website URL": string;
  "Industry / Category": string;
  "Number of Employees": number;
  "Year Founded": number;
  "Annual Revenue": string;
  "Tech Stack": string;
  "First Name": string;
  "Last Name": string;
  "Job Title": string;
  "Work Email": string;
  "Lead Status": string;
  "Acquisition Fit Score": number;
  "Score Rationale / Summary": string;
  "Email Verification": string;
  "Website Status": string;
}
