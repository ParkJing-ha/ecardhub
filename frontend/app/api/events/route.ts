import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../lib/authenticated-django-api";

export async function GET() {
  try {
    const response = await authenticatedDjangoFetch("/api/events/", {
      method: "GET",
    });

    if (!response) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to events server.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await authenticatedDjangoFetch("/api/events/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to events server.",
      },
      {
        status: 503,
      },
    );
  }
}
