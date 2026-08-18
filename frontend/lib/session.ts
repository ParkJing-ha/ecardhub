import { cookies } from "next/headers";
import { getUserBySession } from "./auth-db";

export const sessionCookieName = "ecardhub_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserBySession(cookieStore.get(sessionCookieName)?.value);
}

export function sessionCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}
