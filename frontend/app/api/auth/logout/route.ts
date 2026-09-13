import { NextResponse } from "next/server";
import { djangoFetch } from "../../../../lib/django-api";
import {
  clearAuthCookies,
  getRefreshToken,
} from "../../../../lib/auth-cookies";

export async function POST() {
  try {
    const refresh = await getRefreshToken();

    if (refresh) {
      await djangoFetch("/api/auth/logout/", {
        method: "POST",
        body: JSON.stringify({
          refresh,
        }),
      });
    }

    await clearAuthCookies();

    return NextResponse.json({
      message: "Logout successful.",
    });
  } catch {
    await clearAuthCookies();

    return NextResponse.json({
      message: "Logout successful.",
    });
  }
}
