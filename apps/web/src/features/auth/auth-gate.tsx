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
    setSession(getAuthSession());
    setIsReady(true);
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
        <section className="hero">
          <h1>Innlogging kreves</h1>
          <p>Du må logge inn eller registrere deg for å se denne siden.</p>
        </section>
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
