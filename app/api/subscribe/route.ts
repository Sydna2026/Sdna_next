import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  slug: z.string().trim().min(1).max(60),
});

function token(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid name and email." },
      { status: 400 },
    );
  }
  const { email, slug } = parsed.data;
  const name = parsed.data.name ? parsed.data.name : null;

  const specialization = await prisma.specialization.findUnique({ where: { slug } });
  if (!specialization) {
    return NextResponse.json({ ok: false, error: "Unknown specialization." }, { status: 400 });
  }

  // Upsert the subscriber (keep the latest non-empty name).
  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: name ? { name } : {},
    create: { email, name },
  });

  const existing = await prisma.subscription.findUnique({
    where: {
      subscriberId_specializationId: {
        subscriberId: subscriber.id,
        specializationId: specialization.id,
      },
    },
  });

  // Already confirmed — nothing to do.
  if (existing && existing.status === "active") {
    return NextResponse.json({ ok: true, status: "already" });
  }

  // Create or refresh a pending subscription with a new confirmation token.
  const confirmToken = token();
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: "pending", confirmToken },
    });
  } else {
    await prisma.subscription.create({
      data: {
        subscriberId: subscriber.id,
        specializationId: specialization.id,
        status: "pending",
        confirmToken,
        unsubToken: token(),
      },
    });
  }

  const base = process.env.APP_URL || new URL(req.url).origin;
  const confirmUrl = `${base}/api/confirm?token=${confirmToken}`;

  try {
    await sendConfirmationEmail({
      to: email,
      name,
      specializationTitle: specialization.title,
      confirmUrl,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not send confirmation email. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
