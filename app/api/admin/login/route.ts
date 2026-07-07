import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, createSessionValue, credentialsMatch } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().min(1), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { ok: false, error: "Admin panel is not configured (set ADMIN_EMAIL and ADMIN_PASSWORD)." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success || !credentialsMatch(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
