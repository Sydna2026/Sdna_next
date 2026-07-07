import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const redirect = (status: string, title?: string) => {
    const url = new URL("/subscribed", base);
    url.searchParams.set("status", status);
    if (title) url.searchParams.set("title", title);
    return NextResponse.redirect(url);
  };

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirect("invalid");

  const subscription = await prisma.subscription.findUnique({
    where: { confirmToken: token },
    include: { specialization: true, subscriber: true },
  });
  if (!subscription) return redirect("invalid");

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "active", confirmedAt: new Date(), confirmToken: null },
  });

  const unsubscribeUrl = `${base}/api/unsubscribe?token=${subscription.unsubToken}`;
  try {
    await sendWelcomeEmail({
      to: subscription.subscriber.email,
      name: subscription.subscriber.name,
      specializationTitle: subscription.specialization.title,
      unsubscribeUrl,
    });
  } catch {
    // Welcome email is best-effort; confirmation already succeeded.
  }

  return redirect("confirmed", subscription.specialization.title);
}
