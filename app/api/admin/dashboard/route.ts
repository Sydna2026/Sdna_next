import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const [
    totalSubscribers,
    statusGroups,
    specs,
    activeGroups,
    recentSubscribers,
    recentArticles,
    lastRun,
  ] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.specialization.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: { _count: { select: { resources: true, articles: true } } },
    }),
    prisma.subscription.groupBy({
      by: ["specializationId"],
      where: { status: "active" },
      _count: { _all: true },
    }),
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { specialization: { select: { title: true } } },
    }),
    prisma.ingestRun.findFirst({ orderBy: { ranAt: "desc" } }),
  ]);

  const statusCount = (s: string) =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  const activeMap = new Map(activeGroups.map((g) => [g.specializationId, g._count._all]));

  return NextResponse.json({
    ok: true,
    stats: {
      totalSubscribers,
      active: statusCount("active"),
      pending: statusCount("pending"),
      unsubscribed: statusCount("unsubscribed"),
    },
    specializations: specs.map((s) => ({
      slug: s.slug,
      title: s.title,
      feeds: s._count.resources,
      articles: s._count.articles,
      subscribersActive: activeMap.get(s.id) ?? 0,
    })),
    recentSubscribers: recentSubscribers.map((s) => ({
      email: s.email,
      name: s.name,
      createdAt: s.createdAt,
    })),
    recentArticles: recentArticles.map((a) => ({
      title: a.title,
      link: a.link,
      specialization: a.specialization.title,
      createdAt: a.createdAt,
    })),
    lastIngest: lastRun
      ? {
          ranAt: lastRun.ranAt,
          feedsChecked: lastRun.feedsChecked,
          feedsFailed: lastRun.feedsFailed,
          newArticles: lastRun.newArticles,
          emailsSent: lastRun.emailsSent,
        }
      : null,
  });
}
