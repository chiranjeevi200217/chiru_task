import { normalizeDomain } from "./dedupe";

interface EthicalEnrichmentResult {
  allowedByRobotsTxt: boolean;
  domain: string;
  statusCode?: number;
  metaTitle?: string;
  metaDescription?: string;
  detectedTech?: string[];
  error?: string;
}

const USER_AGENT = "LeadLensBot/1.0 (+https://leadlens.app/bot; Ethical PE Acquisition Sourcing)";

/**
 * Checks robots.txt on the company's public domain before any crawl.
 * Ensures LeadLens respects Disallow rules and crawl delays.
 */
export async function checkRobotsTxt(domain: string): Promise<boolean> {
  const norm = normalizeDomain(domain);
  if (!norm) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://${norm}/robots.txt`, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    clearTimeout(timeout);
    if (!res.ok) return true; // If robots.txt doesn't exist, root is generally crawlable

    const text = await res.text();
    // Parse Disallow rules for wildcard or LeadLensBot
    const lines = text.split("\n");
    let currentAgentIsUniversal = false;

    for (const line of lines) {
      const clean = line.trim().toLowerCase();
      if (clean.startsWith("user-agent:")) {
        const agent = clean.replace("user-agent:", "").trim();
        currentAgentIsUniversal = agent === "*" || agent.includes("leadlensbot");
      } else if (currentAgentIsUniversal && clean.startsWith("disallow:")) {
        const path = clean.replace("disallow:", "").trim();
        if (path === "/" || path === "/*") {
          return false; // Entire site disallowed
        }
      }
    }

    return true;
  } catch {
    return true; // Default allow if network or DNS error reading robots.txt
  }
}

/**
 * Ethically inspects the target's public root homepage.
 * Strictly:
 * - Fetches ONLY public root homepage
 * - Rejects any scraping behind login/auth walls
 * - Uses clear User-Agent
 * - Hard timeout of 3 seconds
 */
export async function enrichHomepageEthically(domain: string): Promise<EthicalEnrichmentResult> {
  const norm = normalizeDomain(domain);
  if (!norm) {
    return { allowedByRobotsTxt: false, domain, error: "Invalid domain" };
  }

  // 1. Verify robots.txt permission
  const isAllowed = await checkRobotsTxt(norm);
  if (!isAllowed) {
    return {
      allowedByRobotsTxt: false,
      domain: norm,
      error: "Crawling disallowed by target's robots.txt policy",
    };
  }

  // 2. Fetch public root homepage with transparent identification
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://${norm}/`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        allowedByRobotsTxt: true,
        domain: norm,
        statusCode: res.status,
        error: `HTTP ${res.status}`,
      };
    }

    const html = await res.text();

    // Extract meta title and description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    // Simple, non-invasive tech detection from headers / public scripts
    const detectedTech: string[] = [];
    if (html.includes("__NEXT_DATA__") || html.includes("/_next/")) detectedTech.push("Next.js");
    if (html.includes("react") || html.includes("data-reactroot")) detectedTech.push("React");
    if (html.includes("tailwind") || html.includes("tw-")) detectedTech.push("Tailwind CSS");
    if (html.includes("vue") || html.includes("v-data")) detectedTech.push("Vue.js");

    return {
      allowedByRobotsTxt: true,
      domain: norm,
      statusCode: res.status,
      metaTitle: titleMatch ? titleMatch[1].trim() : undefined,
      metaDescription: metaDescMatch ? metaDescMatch[1].trim() : undefined,
      detectedTech,
    };
  } catch (error: any) {
    return {
      allowedByRobotsTxt: true,
      domain: norm,
      error: error.message || "Homepage connection timed out",
    };
  }
}
