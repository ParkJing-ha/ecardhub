import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../../lib/authenticated-django-api";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const response = await authenticatedDjangoFetch(
      `/api/events/${eventId}/contributions/`,
      { method: "GET" },
    );

    if (!response) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to contributions server." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const body = await request.json();
    const response = await authenticatedDjangoFetch(
      `/api/events/${eventId}/contributions/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    if (!response) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to contributions server." },
      { status: 503 },
    );
  }
}
