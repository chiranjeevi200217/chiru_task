import Papa from "papaparse";
import { Lead, HubspotLeadExport } from "./types";

/**
 * Converts a list of leads into a clean standard CSV format.
 */
export function formatLeadsToStandardCsv(leads: Lead[]): string {
  const data = leads.map((l) => ({
    "Company Name": l.companyName,
    "Domain": l.domain,
    "Website URL": l.websiteUrl,
    "Category": l.category,
    "Estimated Team Size": l.estimatedTeamSize,
    "Founded Year": l.foundedYear,
    "Company Age (Years)": l.companyAge,
    "ARR Estimate": l.arrHintString || "N/A",
    "Tech Stack": l.techStack.join("; "),
    "Contact Name": l.contactName,
    "Contact Title": l.contactTitle,
    "Contact Email": l.contactEmail,
    "Contact Type": l.contactType,
    "Overall Score": l.overallScore,
    "Score Explanation": l.aiExplanation || "",
    "Email Status": l.emailStatus,
    "Website Status": l.websiteStatus,
    "Merge Status": l.mergeStatus,
  }));

  return Papa.unparse(data);
}

/**
 * Converts a list of leads into a HubSpot CRM-ready CSV format
 * with standard HubSpot contact and company property mappings.
 */
export function formatLeadsToHubspotCsv(leads: Lead[]): string {
  const data: HubspotLeadExport[] = leads.map((l) => {
    const nameParts = (l.contactName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    let leadStatus = "Open";
    if (l.overallScore >= 75) leadStatus = "High Priority ETA Target";
    else if (l.overallScore >= 50) leadStatus = "Medium Fit / Nurture";
    else leadStatus = "Low Priority / Disqualified";

    return {
      "Company Domain Name": l.domain,
      "Company Name": l.companyName,
      "Website URL": l.websiteUrl,
      "Industry / Category": l.category,
      "Number of Employees": l.estimatedTeamSize,
      "Year Founded": l.foundedYear,
      "Annual Revenue": l.arrHintString || "Undisclosed",
      "Tech Stack": l.techStack.join(", "),
      "First Name": firstName,
      "Last Name": lastName,
      "Job Title": l.contactTitle || "Owner",
      "Work Email": l.contactEmail,
      "Lead Status": leadStatus,
      "Acquisition Fit Score": l.overallScore,
      "Score Rationale / Summary": l.aiExplanation || "",
      "Email Verification": l.emailStatus || "UNCHECKED",
      "Website Status": l.websiteStatus || "ONLINE",
    };
  });

  return Papa.unparse(data);
}
