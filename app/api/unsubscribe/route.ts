import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST (not GET) so email link prefetchers can't auto-unsubscribe. The
// /unsubscribe page calls this when the user clicks the button.
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
    where: { unsubToken: token },
    include: { specialization: true },
  });
  if (!subscription) {
    return NextResponse.json(
      { ok: false, error: "This link is invalid or already used." },
      { status: 404 },
    );
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "unsubscribed" },
  });

  return NextResponse.json({ ok: true, title: subscription.specialization.title });
}
