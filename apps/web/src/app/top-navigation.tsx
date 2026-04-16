"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthSession, type AuthSession } from "../features/auth/session";

export function TopNavigation(): JSX.Element {
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(getAuthSession());
  }, [pathname]);

  useEffect(() => {
    function onStorageChange(): void {
      setSession(getAuthSession());
    }

    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return (
    <nav className="top-nav" aria-label="Hovedmeny">
      <div className="top-nav-main">
        <Link href="/">Startside</Link>
        <Link href="/kalorier">Kalori og kosthold</Link>
        <Link href="/trening">Trening</Link>
        <Link href="/leaderboard">Leaderboard</Link>
      </div>
      <div className="top-nav-auth" aria-label="Innlogging">
        {session ? (
          <Link href="/profil">Profil</Link>
        ) : (
          <>
            <Link href="/login">Logg inn</Link>
            <Link href="/register">Registrer</Link>
          </>
        )}
      </div>
    </nav>
  );
}