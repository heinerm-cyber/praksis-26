type ApiErrorBody = {
  error?: string;
};

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit,
  userId: string
): Promise<T> {
  const headers = new Headers(init.headers);

  headers.set("x-user-id", userId);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });

  const parsed = (await response
    .json()
    .catch(() => null)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : `Request feilet (${response.status})`;

    throw new Error(message);
  }

  return parsed as T;
}
