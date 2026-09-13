import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from "./auth-cookies";
import { djangoFetch } from "./django-api";

async function refreshAccessToken() {
  const refresh = await getRefreshToken();

  if (!refresh) {
    return null;
  }

  const response = await djangoFetch("/api/token/refresh/", {
    method: "POST",
    body: JSON.stringify({
      refresh,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access) {
    return null;
  }

  await setAuthCookies(data.access, data.refresh ?? refresh);

  return String(data.access);
}

export async function getOrRefreshAccessToken() {
  return (await getAccessToken()) ?? refreshAccessToken();
}

export async function authenticatedDjangoFetch(
  path: string,
  options: RequestInit = {},
) {
  const accessToken = await getOrRefreshAccessToken();

  if (!accessToken) {
    return null;
  }

  const response = await djangoFetch(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();

  if (!refreshedAccessToken) {
    return response;
  }

  return djangoFetch(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${refreshedAccessToken}`,
    },
  });
}
