"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  googleEnabled: boolean;
};

export function LoginForm({ googleEnabled }: LoginFormProps): JSX.Element {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onGoogleLogin(): void {
    if (!googleEnabled) {
      setError("Google OAuth er ikke konfigurert. Sett GOOGLE_CLIENT_ID og GOOGLE_CLIENT_SECRET.");
      return;
    }

    setError(null);
    setMessage(null);
    window.location.assign("/api/auth/signin/google?callbackUrl=/dashboard");
  }

  async function onLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    setBusy(false);

    if (result?.error) {
      setError("Feil e-post eller passord");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function onRegister(): Promise<void> {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/local-auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Registrering feilet");
        return;
      }

      setMessage("Bruker opprettet. Logger inn...");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        setError("Bruker ble opprettet, men innlogging feilet");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Registrering feilet");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card span-6 login-card">
      <h2>Logg inn</h2>
      <p className="tiny">Velg Google OAuth eller bruk e-post og passord.</p>

      <button
        type="button"
        className="oauth-button"
        onClick={onGoogleLogin}
        disabled={!googleEnabled || busy}
      >
        Fortsett med Google
      </button>

      {!googleEnabled ? (
        <p className="message error">Google OAuth er ikke konfigurert i miljøvariablene.</p>
      ) : null}

      <form className="auth-form" onSubmit={(event) => void onLogin(event)}>
        <label>
          Navn (kun ved registrering)
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label>
          E-post
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Passord
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <div className="actions">
          <button type="submit" disabled={busy}>
            Logg inn
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void onRegister()}
          >
            Registrer bruker
          </button>
        </div>
      </form>

      {message ? <p className="message">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}
    </article>
  );
}