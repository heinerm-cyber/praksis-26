"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setAuthSession } from "./session";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
};

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const isRegister = mode === "register";

  useEffect(() => {
    if (isRegister) {
      return;
    }

    async function hydrateGoogleSession(): Promise<void> {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            email?: string | null;
            name?: string | null;
            sub?: string | null;
          };
          expires?: string;
        };

        if (!payload.user?.email || !payload.user.name) {
          return;
        }

        const googleUserId = payload.user.sub ?? payload.user.email;
        setAuthSession({
          userId: googleUserId,
          email: payload.user.email,
          name: payload.user.name,
          loggedInAt: new Date().toISOString(),
          provider: "google"
        });

        router.push("/");
        router.refresh();
      } catch {
        // Ignore transient session fetch errors in login view.
      }
    }

    void hydrateGoogleSession();
  }, [isRegister, router]);

  async function onGoogleSignIn(): Promise<void> {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Kunne ikke starte Google-innlogging.");
      setIsGoogleSubmitting(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        const registerResponse = await fetch("/api/local-auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
        });

        if (!registerResponse.ok) {
          const payload = (await registerResponse.json().catch(() => ({ error: "Forespørsel feilet" }))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Kunne ikke registrere bruker");
        }
      }

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl: "/",
        redirect: false
      });

      if (!result || result.error) {
        throw new Error("Ugyldig e-post eller passord");
      }

      router.push(result.url ?? "/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ukjent feil");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="card login-card" aria-label={isRegister ? "Registrering" : "Innlogging"}>
      <h2>{isRegister ? "Registrer bruker" : "Logg inn"}</h2>
      {!isRegister ? (
        <button
          type="button"
          className="oauth-button google-signin"
          onClick={() => void onGoogleSignIn()}
          disabled={isGoogleSubmitting || isSubmitting}
        >
          <span className="google-icon" aria-hidden="true">
            <svg viewBox="0 0 18 18" role="img" focusable="false">
              <path
                d="M17.64 9.2c0-.64-.06-1.26-.16-1.85H9v3.5h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.9 2.68-6.63z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.46-.8 5.94-2.17l-2.92-2.26c-.81.54-1.84.86-3.02.86-2.32 0-4.29-1.57-4.99-3.68H1.01v2.32A8.99 8.99 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M4.01 10.75A5.4 5.4 0 0 1 3.73 9c0-.61.1-1.2.28-1.75V4.93H1.01A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82 1.01 4.07l3-2.32z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.45.89 11.42 0 9 0 5.48 0 2.44 2.02 1.01 4.93l3 2.32C4.71 5.14 6.68 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
          </span>
          <span>{isGoogleSubmitting ? "Sender videre..." : "Sign-in with Google"}</span>
        </button>
      ) : null}
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
