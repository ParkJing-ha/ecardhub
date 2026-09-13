import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../lib/authenticated-django-api";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { eventId } = await context.params;

    const response = await authenticatedDjangoFetch(
      `/api/events/${eventId}/`,
      {
        method: "GET",
      },
    );

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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { eventId } = await context.params;

    const response = await authenticatedDjangoFetch(
      `/api/events/${eventId}/`,
      {
        method: "DELETE",
      },
    );

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

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));

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
