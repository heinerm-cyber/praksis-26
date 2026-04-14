export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestInit,
  userId?: string
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (userId) {
    headers.set("x-user-id", userId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Forespørsel feilet" }));
    throw new Error(payload.error ?? "Forespørsel feilet");
  }

  return (await response.json()) as T;
}
