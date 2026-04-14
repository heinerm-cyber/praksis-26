"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAuthSession } from "./session";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
};

type AuthResponse = {
  user: {
    userId: string;
    email: string;
    name: string;
  };
};

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/local-auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isRegister
            ? { name: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password }
        )
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "Forespørsel feilet" }))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Kunne ikke fullføre innlogging");
      }

      const payload = (await response.json()) as AuthResponse;
      setAuthSession({
        userId: payload.user.userId,
        email: payload.user.email,
        name: payload.user.name,
        loggedInAt: new Date().toISOString()
      });

      router.push("/");
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
