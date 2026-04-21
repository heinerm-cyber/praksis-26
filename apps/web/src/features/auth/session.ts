export type AuthSession = {
  accessToken: string;
  userId: string;
  email: string;
  name: string;
  loggedInAt: string;
  provider?: "local" | "google";
};

const SESSION_KEY = "pump.localAuthSession";

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      !parsed.accessToken ||
      !parsed.userId ||
      !parsed.email ||
      !parsed.name ||
      !parsed.loggedInAt
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      loggedInAt: parsed.loggedInAt
    };
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("pump-auth-changed"));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("pump-auth-changed"));
}

export function getAuthAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function isGoogleSession(session: AuthSession | null): boolean {
  return session?.provider === "google";
}
