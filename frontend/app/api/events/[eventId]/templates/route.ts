import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../../lib/authenticated-django-api";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

async function readDjangoResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: response.ok
        ? text
        : "Templates server returned an invalid response.",
      detail: text.slice(0, 500),
    };
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const response = await authenticatedDjangoFetch(`/api/events/${eventId}/templates/`, {
      method: "GET",
    });

    if (!response) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = await readDjangoResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to templates server." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const body = await request.json();
    const response = await authenticatedDjangoFetch(`/api/events/${eventId}/templates/`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = await readDjangoResponse(response);

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to templates server." },
      { status: 503 },
    );
  }
}
