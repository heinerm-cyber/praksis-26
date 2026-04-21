"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../common/api";
import { clearAuthSession, getAuthSession, type AuthSession } from "./session";

type AuthGateProps = {
  children: (session: AuthSession) => JSX.Element;
};

export function AuthGate({ children }: AuthGateProps): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    async function resolveSession(): Promise<void> {
      const localSession = getAuthSession();
      if (!localSession) {
        setIsReady(true);
        return;
      }

      try {
        const meResponse = await requestJson<{
          user: {
            userId: string;
            email: string;
            name: string;
          };
        }>(apiBaseUrl, "/api/auth/me", { method: "GET" }, localSession.accessToken);

        setSession({
          ...localSession,
          userId: meResponse.user.userId,
          email: meResponse.user.email,
          name: meResponse.user.name
        });
      } catch {
        clearAuthSession();
        setSession(null);
      } finally {
        setIsReady(true);
      }
    }

    void resolveSession();
  }, [apiBaseUrl]);

  if (!isReady) {
    return (
      <main>
        <p className="message">Sjekker innlogging...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main>
        <article className="card login-card">
          <p className="tiny">Velg hva du vil gjøre:</p>
          <div className="actions">
            <Link href="/login" className="oauth-button">
              Gå til logg inn
            </Link>
            <Link href="/register" className="oauth-button">
              Registrer bruker
            </Link>
          </div>
        </article>
      </main>
    );
  }

  return children(session);
}
