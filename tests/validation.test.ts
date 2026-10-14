import { describe, it, expect } from "vitest";
import { validateEmailSyntax } from "../lib/validation";

describe("LeadLens Validation Pipeline", () => {
  describe("Email Syntax Validation", () => {
    it("validates proper email formats", () => {
      expect(validateEmailSyntax("elena@flowpulse.io")).toBe(true);
      expect(validateEmailSyntax("marcus.chen@saas-target.co")).toBe(true);
      expect(validateEmailSyntax("founder+test@domain.com")).toBe(true);
    });

    it("rejects malformed email formats", () => {
      expect(validateEmailSyntax("plainaddress")).toBe(false);
      expect(validateEmailSyntax("@missingusername.com")).toBe(false);
      expect(validateEmailSyntax("username@.com")).toBe(false);
      expect(validateEmailSyntax("spaces in email@domain.com")).toBe(false);
      expect(validateEmailSyntax("")).toBe(false);
    });
  });
});
