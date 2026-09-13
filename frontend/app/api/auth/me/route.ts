import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../lib/authenticated-django-api";

export async function GET() {
  try {
    const response = await authenticatedDjangoFetch("/api/auth/me/", {
      method: "GET",
    });

    if (!response) {
      return NextResponse.json(
        { user: null },
        { status: 401 },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
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
