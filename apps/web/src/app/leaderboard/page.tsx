"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "../../features/auth/auth-gate";
import { requestJson } from "../../features/common/api";
import { calculateGamification } from "../../features/common/gamification";

type TrainingPlanPreview = {
  id: string;
  createdAt: string;
  weekPlan: Array<{
    day: string;
    exercises: string[];
  }>;
};

type DietPlanPreview = {
  id: string;
  createdAt: string;
};

type CalorieSessionPreview = {
  id: string;
  createdAt: string;
};

export default function LeaderboardPage(): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );

  return (
    <AuthGate>
      {(session) => <LeaderboardContent apiBaseUrl={apiBaseUrl} userId={session.userId} displayName={session.name} />}
    </AuthGate>
  );
}

type LeaderboardContentProps = {
  apiBaseUrl: string;
  userId: string;
  displayName: string;
};

function LeaderboardContent({ apiBaseUrl, userId, displayName }: LeaderboardContentProps): JSX.Element {
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanPreview[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanPreview[]>([]);
  const [calorieSessions, setCalorieSessions] = useState<CalorieSessionPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gamification = useMemo(
    () =>
      calculateGamification({
        trainingPlans,
        dietPlans,
        calorieSessions
      }),
    [trainingPlans, dietPlans, calorieSessions]
  );

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const [trainingResponse, dietResponse, calorieResponse] = await Promise.all([
          requestJson<{ plans: TrainingPlanPreview[] }>(apiBaseUrl, "/api/training/plans", { method: "GET" }, userId),
          requestJson<{ plans: DietPlanPreview[] }>(apiBaseUrl, "/api/diets/plans", { method: "GET" }, userId),
          requestJson<{ sessions: CalorieSessionPreview[] }>(
            apiBaseUrl,
            "/api/calories/history",
            { method: "GET" },
            userId
          )
        ]);

        setTrainingPlans(trainingResponse.plans);
        setDietPlans(dietResponse.plans);
        setCalorieSessions(calorieResponse.sessions);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente leaderboard");
        setTrainingPlans([]);
        setDietPlans([]);
        setCalorieSessions([]);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [apiBaseUrl, userId]);

  return (
    <main>
      <section className="hero">
        <h1>Leaderboard</h1>
        <p>Personlig rangering for {displayName} basert på lagrede aktiviteter.</p>
      </section>

      {error ? <p className="message error">{error}</p> : null}
      {isLoading ? <p className="message">Henter leaderboard...</p> : null}

      {!isLoading ? (
        <>
          <article className="card gamification-card">
            <h2>Toppliste per uke</h2>
            {gamification.leaderboard.length === 0 ? (
              <p className="tiny">Ingen rangerte uker ennå. Lagre planer og kaloridata for å bygge score.</p>
            ) : (
              <ol className="list leaderboard-list">
                {gamification.leaderboard.map((entry, index) => (
                  <li key={entry.weekKey} className="leaderboard-item">
                    <span>#{index + 1} · {entry.label}</span>
                    <strong>{entry.points} XP</strong>
                  </li>
                ))}
              </ol>
            )}
          </article>

          <article className="card gamification-card">
            <h2>Status</h2>
            <div className="gamification-pill-row">
              <span className="status gamification">⭐ Level {gamification.level}</span>
              <span className="status gamification">🏆 {gamification.totalPoints} XP</span>
              <span className="status gamification">🔥 Streak {gamification.currentStreak}</span>
            </div>
            <div className="message">
              <p className="tiny strong">Fremdrift til neste nivå</p>
              <p className="tiny">
                {gamification.pointsIntoLevel} / {gamification.levelSize} XP · {gamification.pointsToNextLevel} XP igjen
              </p>
              <div className="xp-track" aria-label="XP-fremdrift leaderboard">
                <div className="xp-fill" style={{ width: `${gamification.progressPercent}%` }} />
              </div>
            </div>
          </article>
        </>
      ) : null}
    </main>
  );
}
