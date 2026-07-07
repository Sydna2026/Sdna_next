import type { NextRequest } from "next/server";

// --- Simple in-memory rate limiter -----------------------------------------
// Fine for a single PM2 (fork) instance. For multi-instance, swap for Redis.
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Occasionally drop expired buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
}, 10 * 60 * 1000).unref?.();

// --- Client IP (behind the Nginx reverse proxy) ----------------------------
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// --- URL / host safety ------------------------------------------------------
// Returns the URL string if it's a well-formed http(s) URL, else null.
export function httpUrlOrNull(u: string): string | null {
  try {
    const url = new URL(u);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Blocks obvious internal/loopback/link-local targets to reduce SSRF risk when
// the server fetches admin-supplied feed URLs. Literal-based (no DNS lookup).
export function isBlockedHost(u: string): boolean {
  let host: string;
  try {
    host = new URL(u).hostname.toLowerCase();
  } catch {
    return true;
  }
  if (host === "localhost" || host === "::1" || host === "0.0.0.0") return true;
  if (host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return true;
  // IPv4 private / loopback / link-local ranges
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}
