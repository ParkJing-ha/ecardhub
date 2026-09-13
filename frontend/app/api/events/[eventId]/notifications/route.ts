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
      `/api/events/${eventId}/notifications/`,
      { method: "GET" },
    );

    if (!response) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to notification server." },
      { status: 503 },
    );
  }
}
