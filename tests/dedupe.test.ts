import { describe, it, expect } from "vitest";
import {
  normalizeDomain,
  normalizeCompanyName,
  computeStringSimilarity,
  evaluateLeadSimilarity,
  findDuplicateClusters,
  mergeLeads,
} from "../lib/dedupe";
import { Lead } from "../lib/types";

describe("LeadLens Deduplication & Clean-up Pipeline", () => {
  describe("Domain Normalization", () => {
    it("strips protocols, www, query params, and paths", () => {
      expect(normalizeDomain("https://www.getflowpulse.io/pricing?ref=google")).toBe("getflowpulse.io");
      expect(normalizeDomain("http://app.flowpulse.co/login")).toBe("flowpulse.co");
      expect(normalizeDomain("https://platform.dockmetrics.com/")).toBe("dockmetrics.com");
      expect(normalizeDomain("FLOWPULSE.IO")).toBe("flowpulse.io");
    });
  });

  describe("Company Name Normalization", () => {
    it("removes legal suffixes, SaaS noise words, and punctuation", () => {
      expect(normalizeCompanyName("FlowPulse, Inc.")).toBe("flowpulse");
      expect(normalizeCompanyName("Get Acuity Systems LLC")).toBe("acuity");
      expect(normalizeCompanyName("DockMetrics Software Platform")).toBe("dockmetrics");
      expect(normalizeCompanyName("The Apex Technologies Group")).toBe("apex");
    });
  });

  describe("Fuzzy Similarity & Lead Evaluation", () => {
    it("flags exact canonical domain matches with 1.0 confidence", () => {
      const decision = evaluateLeadSimilarity(
        { companyName: "Acme", domain: "https://www.acme.io/about" },
        { companyName: "Acme App", domain: "http://app.acme.io" }
      );
      expect(decision.isMatch).toBe(true);
      expect(decision.confidence).toBe(1.0);
    });

    it("flags brand stem domain variants (e.g. getacme.io vs acme.io)", () => {
      const decision = evaluateLeadSimilarity(
        { companyName: "Acme Works", domain: "acme.io" },
        { companyName: "Get Acme", domain: "getacme.io" }
      );
      expect(decision.isMatch).toBe(true);
      expect(decision.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("flags fuzzy company name similarity with legal variations", () => {
      const decision = evaluateLeadSimilarity(
        { companyName: "CloudScale Analytics Inc.", domain: "cloudscale.io" },
        { companyName: "Cloudscale Analytics LLC", domain: "cloudscale-app.co" }
      );
      expect(decision.isMatch).toBe(true);
      expect(decision.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it("does not flag completely distinct companies", () => {
      const decision = evaluateLeadSimilarity(
        { companyName: "Stripe", domain: "stripe.com" },
        { companyName: "Datadog", domain: "datadog.com" }
      );
      expect(decision.isMatch).toBe(false);
    });
  });

  describe("Duplicate Cluster Detection", () => {
    it("identifies duplicate pairs in a dataset and groups them into clusters", () => {
      const sampleLeads: Lead[] = [
        {
          id: "lead-1",
          companyName: "FlowPulse",
          normalizedName: "flowpulse",
          domain: "flowpulse.io",
          normalizedDomain: "flowpulse.io",
          websiteUrl: "https://flowpulse.io",
          category: "B2B Workflow",
          description: "Workflow automation",
          estimatedTeamSize: 12,
          foundedYear: 2018,
          companyAge: 8,
          estimatedArrMin: 1200000,
          estimatedArrMax: 1800000,
          arrHintString: "$1.2M ARR",
          techStack: ["React", "PostgreSQL"],
          contactName: "Elena Vance",
          contactTitle: "Founder & CEO",
          contactEmail: "elena@flowpulse.io",
          contactType: "FOUNDER",
          emailStatus: "VALID",
          mxValid: true,
          websiteStatus: "ONLINE",
          httpStatusCode: 200,
          sslValid: true,
          responseTimeMs: 180,
          overallScore: 92,
          scoreBreakdown: { categoryScore: 95, teamSizeScore: 100, companyAgeScore: 100, revenueScore: 100, contactScore: 100, techHealthScore: 100 },
          aiExplanation: "Prime candidate",
          mergeStatus: "ORIGINAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lead-2",
          companyName: "FlowPulse Technologies Inc.",
          normalizedName: "flowpulse",
          domain: "getflowpulse.io",
          normalizedDomain: "getflowpulse.io",
          websiteUrl: "https://getflowpulse.io",
          category: "B2B Workflow",
          description: "Workflow automation",
          estimatedTeamSize: 10,
          foundedYear: 2018,
          companyAge: 8,
          estimatedArrMin: 1200000,
          estimatedArrMax: 1800000,
          arrHintString: "$1.2M ARR",
          techStack: ["React", "Node.js"],
          contactName: "Sales Team",
          contactTitle: "Inquiries",
          contactEmail: "info@flowpulse.io",
          contactType: "GENERIC_INBOX",
          emailStatus: "UNCHECKED",
          mxValid: false,
          websiteStatus: "ONLINE",
          httpStatusCode: 200,
          sslValid: true,
          responseTimeMs: 220,
          overallScore: 68,
          scoreBreakdown: { categoryScore: 95, teamSizeScore: 100, companyAgeScore: 100, revenueScore: 100, contactScore: 30, techHealthScore: 100 },
          aiExplanation: "Duplicate record",
          mergeStatus: "ORIGINAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lead-3",
          companyName: "Unrelated SaaS",
          normalizedName: "unrelated",
          domain: "unrelated.io",
          normalizedDomain: "unrelated.io",
          websiteUrl: "https://unrelated.io",
          category: "DevTools",
          description: "Database tool",
          estimatedTeamSize: 5,
          foundedYear: 2021,
          companyAge: 5,
          estimatedArrMin: 600000,
          estimatedArrMax: 900000,
          arrHintString: "$0.6M ARR",
          techStack: ["Go", "PostgreSQL"],
          contactName: "Mark Davis",
          contactTitle: "Founder",
          contactEmail: "mark@unrelated.io",
          contactType: "FOUNDER",
          emailStatus: "VALID",
          mxValid: true,
          websiteStatus: "ONLINE",
          httpStatusCode: 200,
          sslValid: true,
          responseTimeMs: 250,
          overallScore: 84,
          scoreBreakdown: { categoryScore: 85, teamSizeScore: 85, companyAgeScore: 100, revenueScore: 85, contactScore: 100, techHealthScore: 100 },
          aiExplanation: "Good target",
          mergeStatus: "ORIGINAL",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const clusters = findDuplicateClusters(sampleLeads);
      expect(clusters.length).toBe(1);
      expect(clusters[0].primaryLead.id).toBe("lead-1");
      expect(clusters[0].duplicates[0].lead.id).toBe("lead-2");
    });
  });

  describe("Lead Merge Logic", () => {
    it("merges duplicate into primary, keeping superior contact info and combining tech stacks", () => {
      const primary: Lead = {
        id: "p1",
        companyName: "ApexCRM",
        normalizedName: "apexcrm",
        domain: "apexcrm.io",
        normalizedDomain: "apexcrm.io",
        websiteUrl: "https://apexcrm.io",
        category: "Vertical SaaS",
        description: "CRM for plumbing contractors",
        estimatedTeamSize: 14,
        foundedYear: 2017,
        companyAge: 9,
        estimatedArrMin: 1500000,
        estimatedArrMax: 2200000,
        arrHintString: "$1.5M ARR",
        techStack: ["React", "PostgreSQL"],
        contactName: "General Inquiries",
        contactTitle: "Support",
        contactEmail: "info@apexcrm.io",
        contactType: "GENERIC_INBOX",
        emailStatus: "UNCHECKED",
        mxValid: false,
        websiteStatus: "ONLINE",
        httpStatusCode: 200,
        sslValid: true,
        responseTimeMs: 200,
        overallScore: 72,
        scoreBreakdown: { categoryScore: 100, teamSizeScore: 100, companyAgeScore: 100, revenueScore: 100, contactScore: 20, techHealthScore: 100 },
        aiExplanation: "",
        mergeStatus: "ORIGINAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const duplicate: Lead = {
        ...primary,
        id: "d1",
        companyName: "Apex CRM Inc",
        domain: "getapexcrm.com",
        contactName: "Marcus Vance",
        contactTitle: "Founder & CEO",
        contactEmail: "marcus@apexcrm.io",
        contactType: "FOUNDER",
        emailStatus: "VALID",
        mxValid: true,
        techStack: ["PostgreSQL", "AWS", "Python"],
      };

      const { mergedPrimary, updatedDuplicate } = mergeLeads(primary, duplicate);

      // Primary should have upgraded contact info from duplicate
      expect(mergedPrimary.contactName).toBe("Marcus Vance");
      expect(mergedPrimary.contactType).toBe("FOUNDER");
      expect(mergedPrimary.contactEmail).toBe("marcus@apexcrm.io");
      expect(mergedPrimary.emailStatus).toBe("VALID");
      // Tech stacks combined uniquely
      expect(mergedPrimary.techStack).toContain("React");
      expect(mergedPrimary.techStack).toContain("AWS");
      expect(mergedPrimary.techStack).toContain("Python");

      // Duplicate should be marked as MERGED pointing to primary
      expect(updatedDuplicate.mergeStatus).toBe("MERGED");
      expect(updatedDuplicate.duplicateOfId).toBe("p1");
    });
  });
});
