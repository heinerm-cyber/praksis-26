"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../features/common/api";
import { calculateGamification } from "../features/common/gamification";
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

type CalorieSessionPreview = {
  id: string;
  createdAt: string;
};

export default function HomePage(): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );
  const [trainingPlans, setTrainingPlans] = useState<PlanPreview[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanPreview[]>([]);
  const [calorieSessions, setCalorieSessions] = useState<CalorieSessionPreview[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestTrainingPlan = trainingPlans[0] ?? null;
  const gamification = useMemo(
    () =>
      calculateGamification({
        trainingPlans,
        dietPlans,
        calorieSessions
      }),
    [trainingPlans, dietPlans, calorieSessions]
  );

  async function loadPlans(): Promise<void> {
    if (!authSession) {
      setTrainingPlans([]);
      setDietPlans([]);
      setCalorieSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [trainingResponse, dietResponse, calorieResponse] = await Promise.all([
        requestJson<{ plans: PlanPreview[] }>(apiBaseUrl, "/api/training/plans", { method: "GET" }, authSession.userId),
        requestJson<{ plans: DietPlanPreview[] }>(apiBaseUrl, "/api/diets/plans", { method: "GET" }, authSession.userId),
        requestJson<{ sessions: CalorieSessionPreview[] }>(
          apiBaseUrl,
          "/api/calories/history",
          { method: "GET" },
          authSession.userId
        )
      ]);
      setTrainingPlans(trainingResponse.plans);
      setDietPlans(dietResponse.plans);
      setCalorieSessions(calorieResponse.sessions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente planer");
      setTrainingPlans([]);
      setDietPlans([]);
      setCalorieSessions([]);
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

  function logout(): void {
    clearAuthSession();
    setAuthSession(null);
    setError(null);
  }

  return (
    <main>
      <section className="hero home-hero">
        <h1 className="brand-mark" aria-label="pump.no">
          <span className="brand-pill">Mine lagrede planer</span>
          <span className="brand-word">pump</span>
          <span className="brand-dot">.</span>
          <span className="brand-word">no</span>
        </h1>
        <p>Her ser du siste treningsplan og alle lagrede kostholdplaner.</p>
        {authSession ? (
          <>
            <p className="tiny">Innlogget som: {authSession.name}</p>
            <div className="actions">
              <button className="secondary home-refresh-button" onClick={() => void loadPlans()} disabled={isLoading}>
                {isLoading ? "Oppdaterer..." : "Oppdater planer"}
              </button>
              <button type="button" className="secondary" onClick={logout}>
                Logg ut
              </button>
            </div>
          </>
        ) : (
          <div className="actions">
            <Link href="/login" className="oauth-button">
              Gå til logg inn
            </Link>
            <Link href="/register" className="oauth-button">
              Registrer bruker
            </Link>
          </div>
        )}
      </section>

      {error ? <p className="message error">{error}</p> : null}
      {!authReady ? <p className="message">Sjekker innlogging...</p> : null}
      {authReady && authSession && isLoading ? <p className="message">Henter planene dine...</p> : null}

      {authReady && !authSession ? (
        <article className="card login-card">
          <h2>Logg inn for å se dine planer</h2>
          <p>Login og registrering er aktiv igjen. Velg en av knappene over for å fortsette.</p>
        </article>
      ) : null}

      {!isLoading && authSession ? (
        <section className="home-gamification-grid" aria-label="Gamification-status">
          <article className="card gamification-card">
            <h2>Din utvikling</h2>
            <div className="gamification-pill-row">
              <span className="status gamification">🔥 Streak: {gamification.currentStreak} dager</span>
              <span className="status gamification">⭐ Level {gamification.level}</span>
              <span className="status gamification">🏆 {gamification.totalPoints} XP totalt</span>
            </div>
            <div className="message">
              <p className="tiny strong">Fremdrift mot neste nivå</p>
              <p className="tiny">
                {gamification.pointsIntoLevel} / {gamification.levelSize} XP · {gamification.pointsToNextLevel} XP gjenstår
              </p>
              <div className="xp-track" aria-label="XP-fremdrift startside">
                <div className="xp-fill" style={{ width: `${gamification.progressPercent}%` }} />
              </div>
            </div>
          </article>

          <article className="card gamification-card">
            <h2>Personlig leaderboard</h2>
            {gamification.leaderboard.length === 0 ? (
              <p className="tiny">Ingen rangerte uker ennå. Lagre en plan for å bygge poeng.</p>
            ) : (
              <ol className="list leaderboard-list">
                {gamification.leaderboard.map((entry) => (
                  <li key={entry.weekKey} className="leaderboard-item">
                    <span>{entry.label}</span>
                    <strong>{entry.points} XP</strong>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </section>
      ) : null}

      {authSession ? (
      <section className="home-plan-list" aria-label="Lagrede planer">
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
        ) : !latestTrainingPlan ? (
          <article className="card">
            <h2>Ingen treningsplan ennå</h2>
            <p>Lag en plan i trening, så dukker den opp her.</p>
            <Link className="home-plan-link" href="/trening">
              Gå til trening
            </Link>
          </article>
        ) : (
          <article key={latestTrainingPlan.id} className="card plan-item">
            <h2>{latestTrainingPlan.planName}</h2>
            <p className="tiny">
              {latestTrainingPlan.weeklySessions} økter/uke · {latestTrainingPlan.trainingTypes.join(", ")}
            </p>
            <div className="week-plan-grid">
              {latestTrainingPlan.weekPlan?.map((day) => (
                <div key={`${latestTrainingPlan.id}-${day.day}`} className="day-preview">
                  <p className="tiny strong">{day.day}</p>
                  {day.exercises.length > 0 ? (
                    <ul className="list compact">
                      {day.exercises.map((exercise) => (
                        <li key={`${latestTrainingPlan.id}-${day.day}-${exercise}`}>{exercise}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="tiny">Hvile</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        )}

        {!isLoading ? (
          <article className="card plan-item">
            <h2>Kostholdplaner</h2>
            {dietPlans.length === 0 ? (
              <p className="tiny">Ingen kostholdplaner lagret ennå. Lagre en plan i kosthold-seksjonen.</p>
            ) : (
              <ul className="list plans-list">
                {dietPlans.map((plan) => (
                  <li key={plan.id} className="plan-item">
                    <p>
                      <strong>{plan.planName}</strong>
                      {plan.dailyCalories ? ` · ${plan.dailyCalories} kcal` : ""}
                    </p>
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
        ) : null}
      </section>
      ) : null}
    </main>
  );
}
