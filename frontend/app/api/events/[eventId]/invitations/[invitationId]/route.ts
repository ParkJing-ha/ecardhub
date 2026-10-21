import { NextResponse } from "next/server";
import { authenticatedDjangoFetch } from "../../../../../../lib/authenticated-django-api";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string; invitationId: string }> }) {
  try {
    const { eventId, invitationId } = await context.params;
    if (!/^\d+$/.test(eventId) || !/^\d+$/.test(invitationId)) {
      return NextResponse.json({ error: "Invalid card ID." }, { status: 400 });
    }
    const response = await authenticatedDjangoFetch(`/api/events/${eventId}/invitations/${invitationId}/`, {
      method: "GET",
    });
    if (!response) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: "Unable to load this card. Please try again." }, { status: 503 });
  }
}
