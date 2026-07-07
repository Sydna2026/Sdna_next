import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "sdna_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function key(): string {
  return process.env.ADMIN_PASSWORD || "";
}

// Signed session value: "<expiry>.<hmac>", keyed by ADMIN_PASSWORD.
export function createSessionValue(ttlMs: number = TTL_MS): string {
  const payload = String(Date.now() + ttlMs);
  const sig = createHmac("sha256", key()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionValue(value?: string | null): boolean {
  if (!value || !key()) return false;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", key()).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}

// Constant-time password check for the login route.
export function passwordMatches(input: string): boolean {
  const pw = key();
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

// For API route handlers: allow either a valid session cookie (admin UI) or a
// Bearer ADMIN_PASSWORD (curl/automation).
export function isAdminRequest(req: NextRequest): boolean {
  if (!key()) return false;
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    if (passwordMatches(header.slice(7))) return true;
  }
  return verifySessionValue(req.cookies.get(ADMIN_COOKIE)?.value);
}

// For server components/pages: redirect to login if not authenticated.
export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifySessionValue(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }
}
