import { NextResponse } from "next/server";
import { getContent } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: the site content (DB overrides merged over defaults).
export async function GET() {
  const content = await getContent();
  return NextResponse.json({ ok: true, content });
}
