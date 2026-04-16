"use client";

import { signOut } from "next-auth/react";
import { AuthGate } from "../../features/auth/auth-gate";
import { clearAuthSession } from "../../features/auth/session";

export default function ProfilePage(): JSX.Element {
  async function logout(): Promise<void> {
    clearAuthSession();
    await signOut({ callbackUrl: "/login", redirect: true });
  }

  return (
    <AuthGate>
      {(session) => (
        <main>
          <article className="card login-card">
            <h2>Min bruker</h2>
            <p><strong>Navn:</strong> {session.name}</p>
            <p><strong>E-post:</strong> {session.email}</p>
            <p><strong>Bruker-ID:</strong> {session.userId}</p>
            <p className="tiny">Innlogget: {new Date(session.loggedInAt).toLocaleString("nb-NO")}</p>
            <div className="actions">
              <button type="button" className="secondary" onClick={() => void logout()}>
                Logg ut
              </button>
            </div>
          </article>
        </main>
      )}
    </AuthGate>
  );
}
