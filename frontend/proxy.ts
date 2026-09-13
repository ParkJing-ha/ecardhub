import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./lib/auth-cookies";

const DJANGO_API_URL = process.env.DJANGO_API_URL;

function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );

    if (typeof payload.exp !== "number") {
      return null;
    }

    return payload.exp;
  } catch {
    return null;
  }
}

async function refreshAccessToken(refreshToken: string) {
  if (!DJANGO_API_URL) {
    return null;
  }

  try {
    const response = await fetch(
      `${DJANGO_API_URL}/api/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.access) {
      return null;
    }

    return {
      access: data.access as string,
      refresh: data.refresh as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(
    ACCESS_TOKEN_COOKIE,
  )?.value;

  const refreshToken = request.cookies.get(
    REFRESH_TOKEN_COOKIE,
  )?.value;

  // No authentication cookies.
  // Let dashboard/page.tsx redirect to /auth.
  if (!accessToken && !refreshToken) {
    return NextResponse.next();
  }

  // We have an access token.
  if (accessToken) {
    const expiration = getTokenExpiration(accessToken);

    /*
     * Refresh 30 seconds before actual expiration.
     * This gives us a small safety window against clock differences
     * and requests arriving exactly when the token expires.
     */
    const now = Math.floor(Date.now() / 1000);
    const tokenIsValid =
      expiration !== null && expiration > now + 30;

    if (tokenIsValid) {
      return NextResponse.next();
    }
  }

  // Access token is missing, expired, or malformed.
  // Try the refresh token.
  if (!refreshToken) {
    return NextResponse.next();
  }

  const tokens = await refreshAccessToken(refreshToken);

  if (!tokens) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.access,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    },
  );

  /*
   * SimpleJWT may rotate the refresh token depending on configuration.
   * If Django returns a new refresh token, store it.
   */
  if (tokens.refresh) {
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refresh,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
