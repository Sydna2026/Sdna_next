import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { runIngestion } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Admin "Run ingestion now" button. Same engine as the cron endpoint, but
// authenticated by the admin session/password instead of CRON_SECRET.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const summary = await runIngestion();
  return NextResponse.json({ ok: true, summary });
}
