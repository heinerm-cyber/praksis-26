type ApiErrorBody = {
  error?: string;
};

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestInit,
  userId?: string
): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }

  if (userId) {
    headers.set("x-user-id", userId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  const parsed = (await response
    .json()
    .catch(() => null)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : "Foresporsel feilet";

    throw new Error(message);
  }

  return parsed as T;
}
