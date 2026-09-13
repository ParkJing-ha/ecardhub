import { NextResponse } from "next/server";
import { djangoFetch } from "../../../../lib/django-api";
import { setAuthCookies } from "../../../../lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");

    const response = await djangoFetch("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        full_name: String(body.name ?? ""),
        email,
        phone_number: String(body.phone ?? ""),
        password,
        confirm_password: String(body.confirm ?? ""),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(data ?? { error: "Registration failed." }, {
        status: response.status,
      });
    }

    const loginResponse = await djangoFetch("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const loginData = await loginResponse.json().catch(() => null);

    if (!loginResponse.ok) {
      return NextResponse.json(
        loginData ?? {
          error: "Account created, but sign in failed. Please log in.",
        },
        {
          status: loginResponse.status,
        },
      );
    }

    if (!loginData?.access || !loginData?.refresh) {
      return NextResponse.json(
        {
          error: "Authentication server returned incomplete tokens.",
        },
        {
          status: 502,
        },
      );
    }

    await setAuthCookies(loginData.access, loginData.refresh);

    return NextResponse.json(
      {
        message: data?.message ?? "Account created successfully.",
        user: loginData.user ?? data?.user,
      },
      {
        status: 201,
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
