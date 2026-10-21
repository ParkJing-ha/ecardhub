import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../../../lib/authenticated-django-api";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  try {
    const { eventId } = await context.params;
    if (!/^\d+$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }
    const response = await authenticatedDjangoFetch(`/api/events/${eventId}/invitations/generate/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!response) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: "Unable to generate cards. Please try again." }, { status: 503 });
  }
}
