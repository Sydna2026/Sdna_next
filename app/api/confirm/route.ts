import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST (not GET) so email link prefetchers can't auto-confirm. The /confirm
// page calls this when the user clicks the confirm button.
export async function POST(req: NextRequest) {
  let token = "";
  try {
    token = (await req.json())?.token ?? "";
  } catch {
    token = "";
  }
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { confirmToken: token },
    include: { specialization: true, subscriber: true },
  });
  if (!subscription) {
    return NextResponse.json(
      { ok: false, error: "This link is invalid or already used." },
      { status: 404 },
    );
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "active", confirmedAt: new Date(), confirmToken: null },
  });

  const base = process.env.APP_URL || new URL(req.url).origin;
  try {
    await sendWelcomeEmail({
      to: subscription.subscriber.email,
      name: subscription.subscriber.name,
      specializationTitle: subscription.specialization.title,
      unsubscribeUrl: `${base}/unsubscribe?token=${subscription.unsubToken}`,
    });
  } catch {
    // Best-effort; confirmation already succeeded.
  }

  return NextResponse.json({ ok: true, title: subscription.specialization.title });
}
