import { NextRequest, NextResponse } from "next/server";
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
