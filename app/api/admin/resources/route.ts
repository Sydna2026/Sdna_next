import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manage the research feeds (Resource rows) attached to specializations.
// Auth: admin session cookie (UI) or Bearer ADMIN_PASSWORD (curl/automation).
function guard(req: NextRequest): NextResponse | null {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not set on the server." },
      { status: 503 },
    );
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const resources = await prisma.resource.findMany({
    include: { specialization: { select: { slug: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, resources });
}

const createSchema = z.object({
  specializationSlug: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  feedUrl: z.string().trim().url().max(500),
});

export async function POST(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Provide specializationSlug, name and a valid feedUrl." },
      { status: 400 },
    );
  }
  const spec = await prisma.specialization.findUnique({
    where: { slug: parsed.data.specializationSlug },
  });
  if (!spec) {
    return NextResponse.json({ ok: false, error: "Unknown specialization." }, { status: 400 });
  }
  const resource = await prisma.resource.create({
    data: {
      specializationId: spec.id,
      name: parsed.data.name,
      feedUrl: parsed.data.feedUrl,
    },
  });
  return NextResponse.json({ ok: true, resource });
}

export async function DELETE(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }
  await prisma.resource.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
