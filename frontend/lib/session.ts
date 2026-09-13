import { getAccessToken } from "./auth-cookies";
import { djangoFetch } from "./django-api";
import type { PublicUser } from "../utils/types";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const response = await djangoFetch("/api/auth/me/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    return {
      id: Number(data.id),
      full_name: String(data.full_name ?? ""),
      email: String(data.email ?? ""),
      phone_number: String(data.phone_number ?? ""),
      role: data.role ?? "event_host",
    };
  } catch {
    return null;
  }
}
