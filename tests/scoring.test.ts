import { describe, it, expect } from "vitest";
import {
  calculateCategoryScore,
  calculateTeamSizeScore,
  calculateCompanyAgeScore,
  calculateRevenueScore,
  calculateContactScore,
  calculateTechHealthScore,
  evaluateLeadSignals,
  calculateOverallScore,
  generateDeterministicExplanation,
} from "../lib/scoring";
import { DEFAULT_WEIGHTS, ScoringWeights } from "../lib/types";

describe("LeadLens Pure Scoring Engine", () => {
  describe("Category Fit Scoring", () => {
    it("rewards defensive B2B categories like Vertical SaaS and B2B Workflow", () => {
      expect(calculateCategoryScore("Vertical SaaS")).toBe(100);
      expect(calculateCategoryScore("B2B Workflow")).toBe(95);
      expect(calculateCategoryScore("Cybersecurity & RegTech")).toBe(90);
      expect(calculateCategoryScore("DevTools & Infra")).toBe(85);
    });

    it("penalizes low-margin consumer and agency utility tools", () => {
      expect(calculateCategoryScore("Consumer & Agency Utility")).toBe(35);
    });
  });

  describe("Team Size Scoring", () => {
    it("gives 100 to search fund sweet spot (6 to 25 employees)", () => {
      expect(calculateTeamSizeScore(6)).toBe(100);
      expect(calculateTeamSizeScore(15)).toBe(100);
      expect(calculateTeamSizeScore(25)).toBe(100);
    });

    it("penalizes solo-founder key-man risk", () => {
      expect(calculateTeamSizeScore(1)).toBe(35);
      expect(calculateTeamSizeScore(2)).toBe(35);
    });

    it("penalizes companies too large for ETA searchers", () => {
      expect(calculateTeamSizeScore(70)).toBe(30);
    });
  });

  describe("Company Age Scoring", () => {
    it("gives 100 to proven 4-9 year vintages", () => {
      expect(calculateCompanyAgeScore(4)).toBe(100);
      expect(calculateCompanyAgeScore(7)).toBe(100);
      expect(calculateCompanyAgeScore(9)).toBe(100);
    });

    it("penalizes unproven seed-stage companies (<2 years)", () => {
      expect(calculateCompanyAgeScore(1)).toBe(30);
    });
  });

  describe("Revenue Range Scoring", () => {
    it("gives 100 to ETA sweet spot ($1M - $3M ARR)", () => {
      expect(calculateRevenueScore(1000000, 2500000)).toBe(100);
      expect(calculateRevenueScore(1200000, 1800000)).toBe(100);
    });

    it("penalizes sub-scale revenue (<$300k)", () => {
      expect(calculateRevenueScore(100000, 200000)).toBe(35);
    });

    it("moderates targets exceeding search fund purchase size (>$5M)", () => {
      expect(calculateRevenueScore(6000000, 9000000)).toBe(40);
    });
  });

  describe("Contact Quality Scoring", () => {
    it("awards 100 to named founder with direct work email", () => {
      expect(calculateContactScore("FOUNDER", "elena@acme.io", "Elena Rostova")).toBe(100);
    });

    it("penalizes generic inboxes even for founders", () => {
      expect(calculateContactScore("FOUNDER", "info@acme.io", "Elena Rostova")).toBe(45);
    });

    it("severely penalizes anonymous generic inboxes", () => {
      expect(calculateContactScore("GENERIC_INBOX", "support@acme.io", "General Inquiries")).toBe(20);
    });
  });

  describe("Website & Tech Stack Scoring", () => {
    it("gives 100 for online website with valid SSL and modern stack", () => {
      const score = calculateTechHealthScore("ONLINE", true, ["React", "Node.js", "PostgreSQL"]);
      expect(score).toBe(100);
    });

    it("penalizes unreachable websites", () => {
      const score = calculateTechHealthScore("UNREACHABLE", false, ["React", "Node.js"]);
      expect(score).toBe(50); // Only tech score, 0 for health
    });

    it("discounts legacy stacks with higher maintenance debt", () => {
      const score = calculateTechHealthScore("ONLINE", true, ["PHP", "WordPress", "jQuery"]);
      expect(score).toBe(70); // 50 health + 20 legacy
    });
  });

  describe("Weighted Overall Scoring", () => {
    it("calculates overall score accurately with default weights", () => {
      const breakdown = {
        categoryScore: 100, // weight 15 -> 1500
        teamSizeScore: 100, // weight 20 -> 2000
        companyAgeScore: 100,// weight 15 -> 1500
        revenueScore: 100,  // weight 20 -> 2000
        contactScore: 100,  // weight 15 -> 1500
        techHealthScore: 100,// weight 15 -> 1500
      };
      const score = calculateOverallScore(breakdown, DEFAULT_WEIGHTS);
      expect(score).toBe(100);
    });

    it("dynamically recalculates when custom weights are applied via sliders", () => {
      const breakdown = {
        categoryScore: 100,
        teamSizeScore: 50,
        companyAgeScore: 50,
        revenueScore: 50,
        contactScore: 50,
        techHealthScore: 50,
      };

      // Heavy emphasis on category (e.g. 80% category, others low)
      const customWeights: ScoringWeights = {
        categoryWeight: 50,
        teamSizeWeight: 10,
        companyAgeWeight: 10,
        revenueWeight: 10,
        contactWeight: 10,
        healthTechWeight: 10,
      };

      const defaultScore = calculateOverallScore(breakdown, DEFAULT_WEIGHTS);
      const customScore = calculateOverallScore(breakdown, customWeights);

      expect(customScore).toBeGreaterThan(defaultScore);
    });
  });

  describe("Deterministic Rule-Based Explanation Fallback", () => {
    it("generates a high-fit deal rationale sentence for prime targets", () => {
      const lead = {
        companyName: "AcmePulse",
        category: "Vertical SaaS",
        estimatedTeamSize: 12,
        companyAge: 6,
        arrHintString: "$1.5M - $2.2M ARR",
        contactTitle: "Founder & CEO",
      };
      const breakdown = {
        categoryScore: 100,
        teamSizeScore: 100,
        companyAgeScore: 100,
        revenueScore: 100,
        contactScore: 100,
        techHealthScore: 100,
      };
      const explanation = generateDeterministicExplanation(lead, breakdown, 96);
      expect(explanation).toContain("Prime ETA candidate");
      expect(explanation).toContain("96/100");
    });

    it("generates an objective cautionary explanation for low-scoring leads", () => {
      const lead = {
        companyName: "QuickWidget",
        category: "Consumer & Agency Utility",
        estimatedTeamSize: 1,
        companyAge: 1,
        arrHintString: "$100k ARR",
        contactTitle: "Admin",
      };
      const breakdown = {
        categoryScore: 35,
        teamSizeScore: 35,
        companyAgeScore: 30,
        revenueScore: 35,
        contactScore: 20,
        techHealthScore: 40,
      };
      const explanation = generateDeterministicExplanation(lead, breakdown, 32);
      expect(explanation).toContain("Low acquisition priority");
      expect(explanation).toContain("32/100");
    });
  });
});
