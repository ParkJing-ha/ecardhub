import { NextResponse } from "next/server";
import { djangoFetch } from "../../../../lib/django-api";
import {
  getRefreshToken,
  setAuthCookies,
} from "../../../../lib/auth-cookies";

export async function POST() {
  try {
    const refresh = await getRefreshToken();

    if (!refresh) {
      return NextResponse.json(
        {
          error: "No refresh token.",
        },
        {
          status: 401,
        },
      );
    }

    const response = await djangoFetch(
      "/api/token/refresh/",
      {
        method: "POST",
        body: JSON.stringify({
          refresh,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data,
        {
          status: response.status,
        },
      );
    }

    await setAuthCookies(
      data.access,
      data.refresh ?? refresh,
    );

    return NextResponse.json({
      message: "Token refreshed successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to authentication server.",
      },
      {
        status: 503,
      },
    );
  }
}
