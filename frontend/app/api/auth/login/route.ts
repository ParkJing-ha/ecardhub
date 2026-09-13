import { NextResponse } from "next/server";
import { djangoFetch } from "../../../../lib/django-api";
import { setAuthCookies } from "../../../../lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await djangoFetch("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    if (!data.access || !data.refresh) {
      return NextResponse.json(
        {
          error: "Authentication server returned incomplete tokens.",
        },
        {
          status: 502,
        },
      );
    }

    await setAuthCookies(
      data.access,
      data.refresh,
    );

    return NextResponse.json(
      {
        user: data.user,
      },
      {
        status: 200,
      },
    );
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
