import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(req: NextRequest): NextResponse | null {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

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
      id: sub.id,
      specialization: sub.specialization.title,
      slug: sub.specialization.slug,
      status: sub.status,
      confirmedAt: sub.confirmedAt,
    })),
  }));

  return NextResponse.json({ ok: true, subscribers: result });
}

// Admin adds a subscriber to a specialization directly (marked active — no
// double opt-in needed since the admin is doing it).
const addSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  slug: z.string().trim().min(1),
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
  const parsed = addSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Valid email and specialization required." }, { status: 400 });
  }
  const { email, slug } = parsed.data;
  const name = parsed.data.name ? parsed.data.name : null;

  const spec = await prisma.specialization.findUnique({ where: { slug } });
  if (!spec) {
    return NextResponse.json({ ok: false, error: "Unknown specialization." }, { status: 400 });
  }
  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: name ? { name } : {},
    create: { email, name },
  });
  await prisma.subscription.upsert({
    where: {
      subscriberId_specializationId: {
        subscriberId: subscriber.id,
        specializationId: spec.id,
      },
    },
    update: { status: "active", confirmedAt: new Date(), confirmToken: null },
    create: {
      subscriberId: subscriber.id,
      specializationId: spec.id,
      status: "active",
      confirmedAt: new Date(),
      unsubToken: randomBytes(32).toString("hex"),
    },
  });
  return NextResponse.json({ ok: true });
}

// Change a subscription's status: active | paused | unsubscribed.
const patchSchema = z.object({
  subscriptionId: z.string().min(1),
  status: z.enum(["active", "paused", "unsubscribed"]),
});

export async function PATCH(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

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
  const data: { status: string; confirmedAt?: Date } = { status: parsed.data.status };
  if (parsed.data.status === "active") data.confirmedAt = new Date();
  const updated = await prisma.subscription
    .update({ where: { id: parsed.data.subscriptionId }, data })
    .catch(() => null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Subscription not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Remove a single subscription (?subscriptionId=) or a whole subscriber
// (?subscriberId=, cascades to all their subscriptions).
export async function DELETE(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const subscriptionId = req.nextUrl.searchParams.get("subscriptionId");
  const subscriberId = req.nextUrl.searchParams.get("subscriberId");
  if (subscriptionId) {
    await prisma.subscription.delete({ where: { id: subscriptionId } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  if (subscriberId) {
    await prisma.subscriber.delete({ where: { id: subscriberId } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
}
