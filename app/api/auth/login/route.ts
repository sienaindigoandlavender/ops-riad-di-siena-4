import { NextRequest, NextResponse } from "next/server";

// Verifies the ops password server-side and issues an httpOnly session cookie.
// The password and the session secret live ONLY in server env vars — never
// shipped to the browser.

const COOKIE_NAME = "ops_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60; // seconds

export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const expectedPassword = process.env.OPS_PASSWORD;
    const sessionSecret = process.env.OPS_SESSION_SECRET;

    if (!expectedPassword || !sessionSecret) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    if (!password || password !== expectedPassword) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, sessionSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// Optional logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
