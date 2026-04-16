"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "../../features/auth/auth-gate";
import { clearAuthSession } from "../../features/auth/session";

export default function ProfilePage(): JSX.Element {
  const router = useRouter();

  function logout(): void {
    clearAuthSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <AuthGate>
      {(session) => (
        <main>
          <section className="hero">
            <h1>Profil</h1>
            <p>Her ser du informasjon om brukeren som er logget inn.</p>
          </section>

          <article className="card login-card">
            <h2>Min bruker</h2>
            <p><strong>Navn:</strong> {session.name}</p>
            <p><strong>E-post:</strong> {session.email}</p>
            <p><strong>Bruker-ID:</strong> {session.userId}</p>
            <p className="tiny">Innlogget: {new Date(session.loggedInAt).toLocaleString("nb-NO")}</p>
            <div className="actions">
              <button type="button" className="secondary" onClick={logout}>
                Logg ut
              </button>
            </div>
          </article>
        </main>
      )}
    </AuthGate>
  );
}
