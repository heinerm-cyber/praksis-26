"use client";

import { useMemo, useState } from "react";
import { requestJson } from "../common/api";
import type { Profile } from "../dashboard/types";

type PumpProfileProps = {
  userId: string;
  email: string;
  displayName: string;
};

export function PumpProfile({ userId, email, displayName }: PumpProfileProps): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );

  const [profileName, setProfileName] = useState(displayName);
  const [profileEmail, setProfileEmail] = useState(email);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile(): Promise<void> {
    try {
      setMessage(null);
      setError(null);
      const response = await requestJson<{ profile: Profile | null }>(
        apiBaseUrl,
        "/api/profile/me",
        { method: "GET" },
        userId
      );

      if (!response.profile) {
        setMessage("Ingen profil er lagret ennå.");
        return;
      }

      setProfileName(response.profile.name);
      setProfileEmail(response.profile.email);
      setMessage("Profil lastet.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente profil");
    }
  }

  async function saveProfile(): Promise<void> {
    try {
      setMessage(null);
      setError(null);

      await requestJson<{ profile: Profile }>(
        apiBaseUrl,
        "/api/profile/me",
        {
          method: "POST",
          body: JSON.stringify({
            name: profileName,
            email: profileEmail
          })
        },
        userId
      );

      setMessage("Profil lagret.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke lagre profil");
    }
  }

  return (
    <main>
      <section className="hero">
        <h1>Profil</h1>
        <p>Administrer navnet og e-postadressen som brukes av pump.no.</p>
      </section>

      <section className="grid">
        <article className="card span-6">
          <h2>Min profil</h2>
          <label>
            Bruker-ID
            <input value={userId} readOnly />
          </label>
          <label>
            Navn
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          </label>
          <label>
            E-post
            <input
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
            />
          </label>

          <div className="actions">
            <button className="secondary" onClick={() => void loadProfile()}>
              Hent profil
            </button>
            <button onClick={() => void saveProfile()}>Lagre profil</button>
          </div>

          {message ? <p className="message">{message}</p> : null}
          {error ? <p className="message error">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}