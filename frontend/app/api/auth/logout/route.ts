import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteSession } from "../../../../lib/auth-db";
import { sessionCookieName, sessionCookieOptions } from "../../../../lib/session";

export async function POST(request: NextRequest) {
  await deleteSession(request.cookies.get(sessionCookieName)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...sessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
  return response;
}
