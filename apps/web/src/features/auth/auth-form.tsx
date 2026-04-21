"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { requestJson } from "../common/api";
import { GoogleSigninButton } from "./google-signin-button";
import { setAuthSession } from "./session";
import type { AuthSession } from "./session";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
};

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const router = useRouter();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const handleSession = useCallback(
    (session: AuthSession) => {
      setAuthSession(session);
      router.push("/");
      router.refresh();
    },
    [router]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const trimmedEmail = email.trim();

      const route = isRegister ? "/api/auth/register" : "/api/auth/login";

      const payload = isRegister
        ? {
            name: name.trim(),
            email: trimmedEmail,
            password
          }
        : {
            email: trimmedEmail,
            password
          };

      const response = await requestJson<{
        session: {
          accessToken: string;
          userId: string;
          email: string;
          name: string;
          loggedInAt: string;
          provider: "local" | "google";
        };
      }>(apiBaseUrl, route, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      handleSession(response.session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ukjent feil");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card login-card" aria-label={isRegister ? "Registrering" : "Innlogging"}>
      <h2>{isRegister ? "Registrer bruker" : "Logg inn"}</h2>

      <GoogleSigninButton
        apiBaseUrl={apiBaseUrl}
        disabled={isSubmitting}
        onSession={handleSession}
        onError={setError}
      />

      <p className="tiny">eller bruk e-post og passord</p>

      <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
        {isRegister ? (
          <label>
            Navn
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Ditt navn"
            />
          </label>
        ) : null}
        <label>
          E-post
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="navn@eksempel.no"
          />
        </label>
        <label>
          Passord
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Minst 6 tegn"
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sender..." : isRegister ? "Registrer" : "Logg inn"}
        </button>
      </form>

      {error ? <p className="message error">{error}</p> : null}

      <p className="tiny">
        {isRegister ? "Har du allerede bruker? " : "Har du ikke bruker ennå? "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Gå til logg inn" : "Registrer deg"}
        </Link>
      </p>
    </article>
  );
}
