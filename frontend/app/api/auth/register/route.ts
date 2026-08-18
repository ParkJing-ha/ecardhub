import { NextResponse } from "next/server";
import { createSession, registerUser } from "../../../../lib/auth-db";
import { sessionCookieName, sessionCookieOptions } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await registerUser({
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    password: String(body.password ?? ""),
    confirm: String(body.confirm ?? ""),
  });

  if (result.error || !result.user) {
    return NextResponse.json(
      { error: result.error ?? "Unable to create account." },
      { status: 400 },
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
