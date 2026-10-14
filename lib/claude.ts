import Anthropic from "@anthropic-ai/sdk";
import { Lead, ScoreBreakdown } from "./types";
import { generateDeterministicExplanation } from "./scoring";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("sk-ant-api03-...")) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Generates a one-sentence "why this score" explanation for an acquisition lead.
 * Uses Anthropic Claude API (Claude 3.5 Sonnet / Claude 3 Haiku) when configured.
 * Automatically falls back to high-fidelity deterministic PE rule-based explanation
 * if the API key is missing or the request fails.
 */
export async function generateLeadScoreExplanation(
  lead: {
    companyName: string;
    category: string;
    estimatedTeamSize: number;
    companyAge: number;
    arrHintString?: string;
    contactName?: string;
    contactTitle?: string;
    contactType?: string;
    techStack?: string[];
  },
  breakdown: ScoreBreakdown,
  overallScore: number
): Promise<string> {
  const client = getAnthropicClient();

  if (!client) {
    return generateDeterministicExplanation(lead, breakdown, overallScore);
  }

  try {
    const prompt = `You are a private equity investment director evaluating small B2B SaaS targets for a search fund acquisition.
Target: ${lead.companyName}
Category: ${lead.category}
Age: ${lead.companyAge} years
Team Size: ${lead.estimatedTeamSize} employees
ARR Estimate: ${lead.arrHintString || "N/A"}
Contact: ${lead.contactName || "Unknown"} (${lead.contactTitle || lead.contactType || "Unknown"})
Acquisition Fit Score: ${overallScore}/100
Signal breakdown: Category=${breakdown.categoryScore}, Team=${breakdown.teamSizeScore}, Age=${breakdown.companyAgeScore}, Revenue=${breakdown.revenueScore}, Contact=${breakdown.contactScore}, Tech/Health=${breakdown.techHealthScore}.

Generate exactly ONE punchy, insightful sentence (under 25 words) explaining why this company is or isn't a prime acquisition target for an ETA buyer. Mention the key strength and any caveat. Do not use buzzwords.`;

    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock && contentBlock.type === "text" && contentBlock.text) {
      return contentBlock.text.trim();
    }

    return generateDeterministicExplanation(lead, breakdown, overallScore);
  } catch (error: any) {
    console.warn(`[LeadLens AI] Claude API call failed (${error.message}). Using deterministic fallback.`);
    return generateDeterministicExplanation(lead, breakdown, overallScore);
  }
}
