"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthSession, type AuthSession } from "./session";

type AuthGateProps = {
  children: (session: AuthSession) => JSX.Element;
};

export function AuthGate({ children }: AuthGateProps): JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    async function resolveSession(): Promise<void> {
      const localSession = getAuthSession();
      if (localSession) {
        setSession(localSession);
        setIsReady(true);
        return;
      }

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          setIsReady(true);
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            email?: string | null;
            name?: string | null;
            sub?: string | null;
          };
        };

        if (!payload.user?.email || !payload.user.name) {
          setIsReady(true);
          return;
        }

        setSession({
          userId: payload.user.sub ?? payload.user.email,
          email: payload.user.email,
          name: payload.user.name,
          loggedInAt: new Date().toISOString(),
          provider: "google"
        });
      } catch {
        // Keep fallback behavior: unauthenticated if OAuth session lookup fails.
      } finally {
        setIsReady(true);
      }
    }

    void resolveSession();
  }, []);

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
