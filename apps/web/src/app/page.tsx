"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../features/common/api";
import { clearAuthSession, getAuthSession, type AuthSession } from "../features/auth/session";

type PlanPreview = {
  id: string;
  createdAt: string;
  planName: string;
  weeklySessions: number;
  trainingTypes: string[];
  weekPlan: Array<{
    day: string;
    exercises: string[];
  }>;
};

type DietPlanPreview = {
  id: string;
  createdAt: string;
  planName: string;
  sourceType: "manual" | "from-suggestion";
  dailyCalories?: number;
  dietName?: string;
  notes?: string;
  meals: string[];
};

export default function HomePage(): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );
  const [trainingPlans, setTrainingPlans] = useState<PlanPreview[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanPreview[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestTrainingPlan = trainingPlans[0] ?? null;

  async function loadPlans(): Promise<void> {
    if (!authSession) {
      setTrainingPlans([]);
      setDietPlans([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [trainingResponse, dietResponse] = await Promise.all([
        requestJson<{ plans: PlanPreview[] }>(apiBaseUrl, "/api/training/plans", { method: "GET" }, authSession.userId),
        requestJson<{ plans: DietPlanPreview[] }>(apiBaseUrl, "/api/diets/plans", { method: "GET" }, authSession.userId)
      ]);
      setTrainingPlans(trainingResponse.plans);
      setDietPlans(dietResponse.plans);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente planer");
      setTrainingPlans([]);
      setDietPlans([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function resolveSession(): Promise<void> {
      const localSession = getAuthSession();
      if (localSession) {
        setAuthSession(localSession);
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          setAuthReady(true);
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            email?: string | null;
            name?: string | null;
            sub?: string | null;
          };
        };

        if (!payload.user?.email || !payload.user.name) {
          setAuthReady(true);
          return;
        }

        setAuthSession({
          userId: payload.user.sub ?? payload.user.email,
          email: payload.user.email,
          name: payload.user.name,
          loggedInAt: new Date().toISOString(),
          provider: "google"
        });
      } catch {
        // Keep home unauthenticated if OAuth lookup fails.
      } finally {
        setAuthReady(true);
      }
    }

    void resolveSession();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void loadPlans();
  }, [apiBaseUrl, authSession, authReady]);

  async function logout(): Promise<void> {
    clearAuthSession();
    setAuthSession(null);
    setError(null);
    await signOut({ callbackUrl: "/login", redirect: true });
  }

  return (
    <main>
      {!authSession ? (
        <article className="card login-card">
          <div className="actions">
            <Link href="/login" className="oauth-button">
              Gå til logg inn
            </Link>
            <Link href="/register" className="oauth-button">
              Registrer bruker
            </Link>
          </div>
        </article>
      ) : null}

      {error ? <p className="message error">{error}</p> : null}
      {!authReady ? <p className="message">Sjekker innlogging...</p> : null}
      {authReady && authSession && isLoading ? <p className="message">Henter planene dine...</p> : null}

      {authReady && !authSession ? (
        <article className="card login-card">
          <h2>Logg inn for å se dine planer</h2>
          <p>Login og registrering er aktiv igjen. Velg en av knappene over for å fortsette.</p>
        </article>
      ) : null}

      {authSession ? (
      <section className="home-plan-list" aria-label="Lagrede planer">
        {error ? <p className="message error">{error}</p> : null}
        {actionSuccess ? <p className="message success">{actionSuccess}</p> : null}
        {pendingDeletion ? (
          <div className="message warning undo-banner">
            <p>
              Planen slettes permanent om 5 sekunder.
            </p>
            <button type="button" className="secondary" onClick={undoPendingDeletion}>
              Angre sletting
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <>
            <article className="card home-skeleton-card" aria-hidden="true">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-meta" />
              <div className="week-plan-grid">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={`skeleton-day-${index}`} className="day-preview">
                    <div className="skeleton skeleton-day" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                ))}
              </div>
            </article>
            <article className="card home-skeleton-card" aria-hidden="true">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-meta" />
              <div className="week-plan-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-diet-${index}`} className="day-preview">
                    <div className="skeleton skeleton-day" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : !authReady ? (
          <article className="card empty-state">
            <h2>Klargjører startsiden</h2>
            <p>Vi sjekker innlogging og henter planene dine.</p>
          </article>
        ) : !authSession ? (
          <article className="card empty-state">
            <h2>Logg inn for å se planene dine</h2>
            <p>Når du er logget inn, vises alle lagrede trenings- og kostholdplaner her.</p>
            <div className="actions">
              <Link href="/login" className="oauth-button">
                Gå til logg inn
              </Link>
              <Link href="/register" className="oauth-button">
                Registrer bruker
              </Link>
            </div>
          </article>
        ) : (
          <>
            <article className="card">
              <div className="section-head">
                <h2>Treningsplaner</h2>
              </div>

              {trainingPlans.length === 0 ? (
                <div className="empty-state compact">
                  <p>Du har ingen treningsplaner ennå.</p>
                  <Link href="/trening" className="oauth-button">
                    Opprett første treningsplan
                  </Link>
                </div>
              ) : (
                <div className="home-plan-list">
                  {trainingPlans.map((plan) => (
                    <article key={plan.id} className="plan-item">
                      <div className="plan-item-head">
                        <h3>{plan.planName}</h3>
                        <button
                          type="button"
                          className="secondary"
                          disabled={Boolean(pendingDeletion)}
                          onClick={() => requestTrainingDelete(plan.id)}
                        >
                          Slett plan
                        </button>
                      </div>
                      <p className="tiny">
                        {plan.weeklySessions} økter/uke · {plan.trainingTypes.join(", ")}
                      </p>
                      <div className="week-plan-grid">
                        {plan.weekPlan?.map((day) => (
                          <div key={`${plan.id}-${day.day}`} className="day-preview">
                            <p className="tiny strong">{day.day}</p>
                            {day.exercises.length > 0 ? (
                              <ul className="list compact">
                                {day.exercises.map((exercise) => (
                                  <li key={`${plan.id}-${day.day}-${exercise}`}>{exercise}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="tiny">Hvile</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="card">
              <div className="section-head">
                <h2>Kostholdplaner</h2>
              </div>

              {dietPlans.length === 0 ? (
                <div className="empty-state compact">
                  <p>Du har ingen kostholdplaner ennå.</p>
                  <Link href="/kalorier" className="oauth-button">
                    Opprett første kostholdplan
                  </Link>
                </div>
              ) : (
                <ul className="list plans-list">
                  {dietPlans.map((plan) => (
                    <li key={plan.id} className="plan-item">
                      <div className="plan-item-head">
                        <p>
                          <strong>{plan.planName}</strong>
                          {plan.dailyCalories ? ` · ${plan.dailyCalories} kcal` : ""}
                        </p>
                        <button
                          type="button"
                          className="secondary"
                          disabled={Boolean(pendingDeletion)}
                          onClick={() => requestDietDelete(plan.id)}
                        >
                          Slett plan
                        </button>
                      </div>
                      <p className="tiny">
                        Kilde: {plan.sourceType === "manual" ? "Manuell" : "Fra forslag"}
                        {plan.dietName ? ` · ${plan.dietName}` : ""}
                      </p>
                      {plan.notes ? <p className="tiny">Notat: {plan.notes}</p> : null}
                      <ul className="list compact">
                        {plan.meals.map((meal, index) => (
                          <li key={`${plan.id}-${index}-${meal}`}>{meal}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </>
        )}
      </section>
      ) : null}

      {authSession ? (
        <article className="card login-card">
          <div className="actions">
            <button className="secondary home-refresh-button" onClick={() => void loadPlans()} disabled={isLoading}>
              {isLoading ? "Oppdaterer..." : "Oppdater planer"}
            </button>
            <button type="button" className="secondary" onClick={logout}>
              Logg ut
            </button>
          </div>
        </article>
      ) : null}
    </main>
  );
}
