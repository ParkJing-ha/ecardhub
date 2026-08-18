import { NextResponse } from "next/server";
import { createSession, loginUser } from "../../../../lib/auth-db";
import { sessionCookieName, sessionCookieOptions } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await loginUser({
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
  });

  if (result.error || !result.user) {
    return NextResponse.json(
      { error: result.error ?? "Unable to sign in." },
      { status: 401 },
    );
  }

  const session = await createSession(result.user.id);
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(
    sessionCookieName,
    session.token,
    sessionCookieOptions(session.expiresAt),
  );
  return response;
}
