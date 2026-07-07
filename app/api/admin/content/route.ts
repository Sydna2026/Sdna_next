import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";
import { getContent } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS = ["home", "contact", "footer", "branding"] as const;

function guard(req: NextRequest): NextResponse | null {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Admin not configured." }, { status: 503 });
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

// Current merged content, for pre-filling the editors.
export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  return NextResponse.json({ ok: true, content: await getContent() });
}

const putSchema = z.object({
  key: z.enum(KEYS),
  value: z.record(z.string(), z.any()),
});

// Save one content section (home / contact / footer / branding).
export async function PUT(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid content payload." }, { status: 400 });
  }

  const jsonString = JSON.stringify(parsed.data.value);
  await prisma.siteContent.upsert({
    where: { key: parsed.data.key },
    update: { json: jsonString },
    create: { key: parsed.data.key, json: jsonString },
  });
  return NextResponse.json({ ok: true });
}
