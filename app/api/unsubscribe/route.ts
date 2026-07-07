import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const redirect = (status: string, title?: string) => {
    const url = new URL("/unsubscribed", base);
    url.searchParams.set("status", status);
    if (title) url.searchParams.set("title", title);
    return NextResponse.redirect(url);
  };

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirect("invalid");

  const subscription = await prisma.subscription.findUnique({
    where: { unsubToken: token },
    include: { specialization: true },
  });
  if (!subscription) return redirect("invalid");

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "unsubscribed" },
  });

  return redirect("done", subscription.specialization.title);
}
