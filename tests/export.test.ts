import { describe, it, expect } from "vitest";
import { formatLeadsToStandardCsv, formatLeadsToHubspotCsv } from "../lib/export";
import { Lead } from "../lib/types";

describe("LeadLens Export Engine", () => {
  const sampleLeads: Lead[] = [
    {
      id: "lead-1",
      companyName: "AcmePulse",
      normalizedName: "acmepulse",
      domain: "acmepulse.io",
      normalizedDomain: "acmepulse.io",
      websiteUrl: "https://acmepulse.io",
      category: "Vertical SaaS",
      description: "HVAC dispatch",
      estimatedTeamSize: 15,
      foundedYear: 2019,
      companyAge: 7,
      estimatedArrMin: 1500000,
      estimatedArrMax: 2200000,
      arrHintString: "$1.5M - $2.2M ARR",
      techStack: ["React", "PostgreSQL"],
      contactName: "Elena Rostova",
      contactTitle: "Founder & CEO",
      contactEmail: "elena@acmepulse.io",
      contactType: "FOUNDER",
      emailStatus: "VALID",
      mxValid: true,
      websiteStatus: "ONLINE",
      httpStatusCode: 200,
      sslValid: true,
      responseTimeMs: 160,
      overallScore: 88,
      scoreBreakdown: { categoryScore: 100, teamSizeScore: 100, companyAgeScore: 100, revenueScore: 100, contactScore: 100, techHealthScore: 100 },
      aiExplanation: "Prime acquisition candidate",
      mergeStatus: "ORIGINAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("exports standard CSV format with all essential fields", () => {
    const csv = formatLeadsToStandardCsv(sampleLeads);
    expect(csv).toContain("Company Name");
    expect(csv).toContain("Domain");
    expect(csv).toContain("AcmePulse");
    expect(csv).toContain("Vertical SaaS");
    expect(csv).toContain("elena@acmepulse.io");
  });

  it("exports CRM-ready format with HubSpot-specific property headers", () => {
    const hubspotCsv = formatLeadsToHubspotCsv(sampleLeads);
    expect(hubspotCsv).toContain("Company Domain Name");
    expect(hubspotCsv).toContain("Annual Revenue");
    expect(hubspotCsv).toContain("Acquisition Fit Score");
    expect(hubspotCsv).toContain("First Name");
    expect(hubspotCsv).toContain("Last Name");
    expect(hubspotCsv).toContain("Work Email");
    expect(hubspotCsv).toContain("High Priority ETA Target");
    expect(hubspotCsv).toContain("Elena");
    expect(hubspotCsv).toContain("Rostova");
  });
});
