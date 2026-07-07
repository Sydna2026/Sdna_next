import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        include: { specialization: { select: { slug: true, title: true } } },
      },
    },
  });

  const result = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    createdAt: s.createdAt,
    subscriptions: s.subscriptions.map((sub) => ({
      specialization: sub.specialization.title,
      slug: sub.specialization.slug,
      status: sub.status,
      confirmedAt: sub.confirmedAt,
    })),
  }));

  return NextResponse.json({ ok: true, subscribers: result });
}
