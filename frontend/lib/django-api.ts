const DJANGO_API_URL = process.env.DJANGO_API_URL;

export async function djangoFetch(
  path: string,
  options: RequestInit = {},
) {
  if (!DJANGO_API_URL) {
    throw new Error("DJANGO_API_URL is not configured.");
  }

  return fetch(`${DJANGO_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });
}
