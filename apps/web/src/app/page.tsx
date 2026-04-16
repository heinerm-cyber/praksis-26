"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../features/common/api";
import { getAuthSession, type AuthSession } from "../features/auth/session";

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

type PendingDeletion =
  | {
      kind: "training";
      index: number;
      plan: PlanPreview;
    }
  | {
      kind: "diet";
      index: number;
      plan: DietPlanPreview;
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
    setAuthSession(getAuthSession());
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void loadPlans();
  }, [apiBaseUrl, authSession, authReady]);

  function restorePendingPlan(deletion: PendingDeletion): void {
    if (deletion.kind === "training") {
      setTrainingPlans((current) => {
        const next = [...current];
        next.splice(deletion.index, 0, deletion.plan);
        return next;
      });
      return;
    }

    setDietPlans((current) => {
      const next = [...current];
      next.splice(deletion.index, 0, deletion.plan);
      return next;
    });
  }

  async function commitPendingDeletion(deletion: PendingDeletion): Promise<void> {
    if (!authSession) {
      return;
    }

    try {
      const path =
        deletion.kind === "training"
          ? `/api/training/plans/${deletion.plan.id}`
          : `/api/diets/plans/${deletion.plan.id}`;

      setError(null);
      setActionSuccess(null);
      await requestJson<{ deleted: boolean }>(apiBaseUrl, path, { method: "DELETE" }, authSession.userId);

      setActionSuccess(
        deletion.kind === "training" ? "Treningsplan slettet permanent." : "Kostholdplan slettet permanent."
      );
    } catch (deleteError) {
      restorePendingPlan(deletion);
      setError(deleteError instanceof Error ? deleteError.message : "Kunne ikke slette plan");
    } finally {
      setPendingDeletion((current) => {
        if (!current) {
          return null;
        }

        if (current.kind === deletion.kind && current.plan.id === deletion.plan.id) {
          return null;
        }

        return current;
      });
    }
  }

  useEffect(() => {
    if (!pendingDeletion || !authSession) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void commitPendingDeletion(pendingDeletion);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingDeletion, authSession, apiBaseUrl]);

  function requestTrainingDelete(planId: string): void {
    if (pendingDeletion) {
      setError("Fullfør eller angre forrige sletting før du sletter en ny plan.");
      return;
    }

    const index = trainingPlans.findIndex((plan) => plan.id === planId);
    if (index < 0) {
      return;
    }

    const plan = trainingPlans[index];
    setTrainingPlans((current) => current.filter((item) => item.id !== planId));
    setPendingDeletion({ kind: "training", index, plan });
    setError(null);
    setActionSuccess("Treningsplan markert for sletting. Angre innen 5 sekunder.");
  }

  function requestDietDelete(planId: string): void {
    if (pendingDeletion) {
      setError("Fullfør eller angre forrige sletting før du sletter en ny plan.");
      return;
    }

    const index = dietPlans.findIndex((plan) => plan.id === planId);
    if (index < 0) {
      return;
    }

    const plan = dietPlans[index];
    setDietPlans((current) => current.filter((item) => item.id !== planId));
    setPendingDeletion({ kind: "diet", index, plan });
    setError(null);
    setActionSuccess("Kostholdplan markert for sletting. Angre innen 5 sekunder.");
  }

  function undoPendingDeletion(): void {
    if (!pendingDeletion) {
      return;
    }

    restorePendingPlan(pendingDeletion);
    setPendingDeletion(null);
    setError(null);
    setActionSuccess("Sletting ble angret.");
  }

  return (
    <main>
      <section className="hero home-hero" aria-label="pump.no merkevare">
        <h1 className="brand-mark" aria-label="pump.no">
          <span className="brand-pill">Mine lagrede planer</span>
          <span className="brand-word">pump</span>
          <span className="brand-dot">.</span>
          <span className="brand-word">no</span>
        </h1>
        {authSession ? (
          <p className="tiny">Innlogget som: {authSession.name}</p>
        ) : null}
      </section>

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
                <Link href="/trening" className="section-link">
                  Lag ny plan
                </Link>
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
                <Link href="/kalorier" className="section-link">
                  Lag ny plan
                </Link>
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
    </main>
  );
}
