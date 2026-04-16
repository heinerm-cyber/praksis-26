"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionResponse = {
  user?: {
    email?: string | null;
  };
};

export function TopNavAuth(): JSX.Element | null {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkSession(): Promise<void> {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          setIsLoggedIn(false);
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        setIsLoggedIn(Boolean(payload.user));
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsReady(true);
      }
    }

    void checkSession();
  }, []);

  if (!isReady || isLoggedIn) {
    return null;
  }

  return (
    <div className="top-nav-auth" aria-label="Innlogging">
      <Link href="/login">Logg inn</Link>
    </div>
  );
}
