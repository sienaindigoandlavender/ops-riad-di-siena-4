import { NextRequest, NextResponse } from "next/server";

// Lightweight session check for the client gate.
// Middleware already 401s API routes without a valid cookie, but this gives
// the PasswordGate a clean yes/no on load.

const COOKIE_NAME = "ops_session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.OPS_SESSION_SECRET;
  if (token && expected && token === expected) {
    return NextResponse.json({ authed: true });
  }
  return NextResponse.json({ authed: false }, { status: 401 });
}
