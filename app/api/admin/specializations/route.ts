import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const specs = await prisma.specialization.findMany({
    orderBy: { title: "asc" },
    include: {
      _count: {
        select: {
          resources: true,
          subscriptions: true,
          articles: true,
        },
      },
    },
  });
  // Also count only ACTIVE subscriptions per spec.
  const activeCounts = await prisma.subscription.groupBy({
    by: ["specializationId"],
    where: { status: "active" },
    _count: { _all: true },
  });
  const activeMap = new Map(activeCounts.map((c) => [c.specializationId, c._count._all]));

  const result = specs.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    feeds: s._count.resources,
    articles: s._count.articles,
    subscribersTotal: s._count.subscriptions,
    subscribersActive: activeMap.get(s.id) ?? 0,
  }));

  return NextResponse.json({ ok: true, specializations: result });
}

const patchSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  details: z.array(z.string().trim().max(500)).max(20).optional(),
  sortOrder: z.number().int().optional(),
});

// Edit a specialization's guideline content (title / description / bullets / order).
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
  const { slug, title, description, details, sortOrder } = parsed.data;
  const data: {
    title?: string;
    description?: string;
    detailsJson?: string;
    sortOrder?: number;
  } = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (details !== undefined) data.detailsJson = JSON.stringify(details.filter((d) => d.length));
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const updated = await prisma.specialization
    .update({ where: { slug }, data })
    .catch(() => null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Unknown specialization." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
