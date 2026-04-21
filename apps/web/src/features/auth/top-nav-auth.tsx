"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthSession } from "./session";

export function TopNavAuth(): JSX.Element | null {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    function updateFromStorage(): void {
      setIsLoggedIn(Boolean(getAuthSession()));
      setIsReady(true);
    }

    updateFromStorage();
    window.addEventListener("storage", updateFromStorage);
    window.addEventListener("pump-auth-changed", updateFromStorage);

    return () => {
      window.removeEventListener("storage", updateFromStorage);
      window.removeEventListener("pump-auth-changed", updateFromStorage);
    };
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
