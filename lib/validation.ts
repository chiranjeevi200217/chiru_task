import dns from "dns";
import { cache } from "./cache";
import { ValidationStatus, WebsiteStatus } from "./types";
import { normalizeDomain } from "./dedupe";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email format using RFC standards and checks for malformed syntax.
 */
export function validateEmailSyntax(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Resolves MX records for a domain via DNS.
 * Results are cached in Redis with a 24-hour TTL to prevent redundant lookups.
 */
export async function verifyDomainMx(domainOrEmail: string): Promise<boolean> {
  let domain = domainOrEmail;
  if (domainOrEmail.includes("@")) {
    domain = domainOrEmail.split("@")[1];
  }
  domain = normalizeDomain(domain);
  if (!domain) return false;

  const cacheKey = `val:mx:${domain}`;
  const cached = await cache.get<boolean>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const records = await dns.promises.resolveMx(domain);
    const hasMx = Array.isArray(records) && records.length > 0;
    await cache.set(cacheKey, hasMx, 86400); // 24 hours TTL
    return hasMx;
  } catch (error) {
    // If MX lookup fails, check A/AAAA record fallback (RFC 5321 section 5.1)
    try {
      const aRecords = await dns.promises.resolve4(domain);
      const hasA = Array.isArray(aRecords) && aRecords.length > 0;
      await cache.set(cacheKey, hasA, 86400);
      return hasA;
    } catch {
      await cache.set(cacheKey, false, 86400);
      return false;
    }
  }
}

/**
 * Checks website health, responsiveness, HTTP status code, and SSL certificate.
 * Cached with 24-hour TTL.
 */
export async function checkWebsiteHealth(
  domainOrUrl: string
): Promise<{
  websiteStatus: WebsiteStatus;
  httpStatusCode: number;
  sslValid: boolean;
  responseTimeMs: number;
}> {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) {
    return {
      websiteStatus: "UNREACHABLE",
      httpStatusCode: 0,
      sslValid: false,
      responseTimeMs: 0,
    };
  }

  const cacheKey = `val:web:${domain}`;
  const cached = await cache.get<{
    websiteStatus: WebsiteStatus;
    httpStatusCode: number;
    sslValid: boolean;
    responseTimeMs: number;
  }>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

  try {
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "LeadLensBot/1.0 (+https://leadlens.app/bot; PE Due Diligence)",
      },
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const isOnline = res.status >= 200 && res.status < 400;
    const isRedirect = res.status >= 300 && res.status < 400;

    const result = {
      websiteStatus: (isOnline ? (isRedirect ? "REDIRECT" : "ONLINE") : "UNREACHABLE") as WebsiteStatus,
      httpStatusCode: res.status,
      sslValid: true,
      responseTimeMs,
    };

    await cache.set(cacheKey, result, 86400);
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === "AbortError";
    const result = {
      websiteStatus: (isTimeout ? "TIMEOUT" : "UNREACHABLE") as WebsiteStatus,
      httpStatusCode: isTimeout ? 504 : 0,
      sslValid: false,
      responseTimeMs: Date.now() - startTime,
    };

    await cache.set(cacheKey, result, 86400);
    return result;
  }
}
