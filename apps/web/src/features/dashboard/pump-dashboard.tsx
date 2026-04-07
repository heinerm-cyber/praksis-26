"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CalorieInput,
  CalorieSession,
  DietSuggestion,
  StorageMode,
  TrainingPlan
} from "./types";

type HealthResponse = {
  status: string;
  storageMode: StorageMode;
  fallbackActive: boolean;
};

const predefinedTrainingTypes = [
  "Styrke",
  "Kondisjon",
  "Mobilitet",
  "Intervall",
  "Core",
  "Hypertrofi"
];

const initialCalorieInput: CalorieInput = {
  currentWeightKg: 85,
  targetWeightKg: 80,
  monthsToGoal: 4,
  activityLevel: "medium"
};

async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestInit,
  userId?: string
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (userId) {
    headers.set("x-user-id", userId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Forespørsel feilet" }));
    throw new Error(payload.error ?? "Forespørsel feilet");
  }

  return (await response.json()) as T;
}

export function PumpDashboard(): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );

  const [storageMode, setStorageMode] = useState<StorageMode>("memory");
  const [healthError, setHealthError] = useState<string | null>(null);

  const [userId, setUserId] = useState("demo-user-1");
  const [profileName, setProfileName] = useState("Pump Bruker");
  const [profileEmail, setProfileEmail] = useState("bruker@pump.no");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [calorieInput, setCalorieInput] = useState<CalorieInput>(initialCalorieInput);
  const [calorieSession, setCalorieSession] = useState<CalorieSession | null>(null);
  const [calorieError, setCalorieError] = useState<string | null>(null);

  const [dietSuggestion, setDietSuggestion] = useState<DietSuggestion | null>(null);
  const [dietError, setDietError] = useState<string | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Styrke"]);
  const [planName, setPlanName] = useState("Min ukeplan");
  const [weeklySessions, setWeeklySessions] = useState(4);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [trainingSuggestions, setTrainingSuggestions] = useState<string[]>([]);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  async function loadHealth(): Promise<void> {
    try {
      setHealthError(null);
      const response = await fetch(`${apiBaseUrl}/health`);
      if (!response.ok) {
        throw new Error("Kunne ikke hente helsestatus");
      }
      const health = (await response.json()) as HealthResponse;
      setStorageMode(health.storageMode);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : "Ukjent feil");
    }
  }

  useEffect(() => {
    void loadHealth();
    const id = setInterval(() => {
      void loadHealth();
    }, 20000);
    return () => clearInterval(id);
  }, [apiBaseUrl]);

  async function saveProfile(): Promise<void> {
    try {
      setProfileError(null);
      setProfileMessage(null);

      const payload = {
        name: profileName,
        email: profileEmail
      };

      await requestJson<{ profile: unknown }>(apiBaseUrl, "/api/profile/me", {
        method: "POST",
        body: JSON.stringify(payload)
      }, userId);

      setProfileMessage("Profil lagret");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Kunne ikke lagre profil");
    }
  }

  async function runCalorieCalculation(): Promise<void> {
    try {
      setCalorieError(null);
      const response = await requestJson<{ session: CalorieSession }>(
        apiBaseUrl,
        "/api/calories/calculate",
        {
          method: "POST",
          body: JSON.stringify(calorieInput)
        },
        userId
      );
      setCalorieSession(response.session);

      const dietResponse = await requestJson<{ suggestion: DietSuggestion }>(
        apiBaseUrl,
        `/api/diets/suggestions?dailyCalories=${response.session.result.dailyCalories}`,
        { method: "GET" },
        userId
      );
      setDietSuggestion(dietResponse.suggestion);
      setDietError(null);

      const trainingResponse = await requestJson<{ suggestions: string[] }>(
        apiBaseUrl,
        `/api/training/suggestions?dailyCalories=${response.session.result.dailyCalories}`,
        { method: "GET" },
        userId
      );
      setTrainingSuggestions(trainingResponse.suggestions);
    } catch (error) {
      setCalorieError(error instanceof Error ? error.message : "Kalkulering feilet");
    }
  }

  async function createTrainingPlan(): Promise<void> {
    try {
      setTrainingError(null);
      await requestJson<{ plan: TrainingPlan }>(
        apiBaseUrl,
        "/api/training/plans",
        {
          method: "POST",
          body: JSON.stringify({
            planName,
            trainingTypes: selectedTypes,
            weeklySessions
          })
        },
        userId
      );

      const listResponse = await requestJson<{ plans: TrainingPlan[] }>(
        apiBaseUrl,
        "/api/training/plans",
        { method: "GET" },
        userId
      );
      setTrainingPlans(listResponse.plans);
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : "Kunne ikke lagre treningsplan");
    }
  }

  function toggleTrainingType(type: string): void {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        const filtered = current.filter((item) => item !== type);
        return filtered.length > 0 ? filtered : current;
      }
      return [...current, type];
    });
  }

  return (
    <main>
      <section className="hero">
        <h1>pump.no</h1>
        <p>
          Nettbasert MVP for profil, kalorikalkulering, kostholdsråd og treningsplaner, bygget med API-først
          arkitektur.
        </p>
        <span className={`status ${storageMode === "memory" ? "memory" : ""}`}>
          Lagringsmodus: {storageMode}
        </span>
        {healthError ? <p className="message error">{healthError}</p> : null}
        {storageMode === "memory" ? (
          <p className="message error">
            Fallback er aktiv: data lagres midlertidig i minnet og kan forsvinne ved omstart.
          </p>
        ) : null}
      </section>

      <section className="grid">
        <article className="card span-4">
          <h2>Profil</h2>
          <div className="row">
            <label>
              Bruker-ID
              <input value={userId} onChange={(event) => setUserId(event.target.value)} />
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
          </div>
          <button onClick={() => void saveProfile()}>Lagre profil</button>
          {profileMessage ? <p className="message">{profileMessage}</p> : null}
          {profileError ? <p className="message error">{profileError}</p> : null}
        </article>

        <article className="card span-8">
          <h2>Kalorikalkulering</h2>
          <div className="row three">
            <label>
              Nåværende vekt (kg)
              <input
                type="number"
                min={1}
                value={calorieInput.currentWeightKg}
                onChange={(event) =>
                  setCalorieInput((state) => ({
                    ...state,
                    currentWeightKg: Number(event.target.value)
                  }))
                }
              />
            </label>
            <label>
              Målvekt (kg)
              <input
                type="number"
                min={1}
                value={calorieInput.targetWeightKg}
                onChange={(event) =>
                  setCalorieInput((state) => ({
                    ...state,
                    targetWeightKg: Number(event.target.value)
                  }))
                }
              />
            </label>
            <label>
              Måneder til mål
              <input
                type="number"
                min={1}
                max={36}
                value={calorieInput.monthsToGoal}
                onChange={(event) =>
                  setCalorieInput((state) => ({
                    ...state,
                    monthsToGoal: Number(event.target.value)
                  }))
                }
              />
            </label>
          </div>
          <label>
            Aktivitetsnivå
            <select
              value={calorieInput.activityLevel}
              onChange={(event) =>
                setCalorieInput((state) => ({
                  ...state,
                  activityLevel: event.target.value as CalorieInput["activityLevel"]
                }))
              }
            >
              <option value="low">Lav</option>
              <option value="medium">Medium</option>
              <option value="high">Høy</option>
            </select>
          </label>
          <button onClick={() => void runCalorieCalculation()}>Beregn daglig inntak</button>
          {calorieError ? <p className="message error">{calorieError}</p> : null}
          {calorieSession ? (
            <div className="message">
              <p className="kpi">{calorieSession.result.dailyCalories} kcal / dag</p>
              <p className="tiny">
                Forventet endring: {calorieSession.result.monthlyChangeKg.toFixed(2)} kg per måned.
              </p>
              {calorieSession.result.notes.length > 0 ? (
                <ul className="list">
                  {calorieSession.result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="card span-6">
          <h2>Kosthold og diettforslag</h2>
          {dietSuggestion ? (
            <>
              <p>
                <strong>{dietSuggestion.dietName}</strong> for ca. {dietSuggestion.dailyCalories} kcal.
              </p>
              <ul className="list">
                {dietSuggestion.meals.map((meal) => (
                  <li key={meal}>{meal}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="tiny">Kjør kalorikalkulering for å hente forslag.</p>
          )}
          {dietError ? <p className="message error">{dietError}</p> : null}
        </article>

        <article className="card span-6">
          <h2>Treningsplaner</h2>
          <label>
            Plan-navn
            <input value={planName} onChange={(event) => setPlanName(event.target.value)} />
          </label>
          <label>
            Økter per uke
            <input
              type="number"
              min={1}
              max={14}
              value={weeklySessions}
              onChange={(event) => setWeeklySessions(Number(event.target.value))}
            />
          </label>
          <div className="row two">
            {predefinedTrainingTypes.map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleTrainingType(type)}
                />
                {type}
              </label>
            ))}
          </div>
          <button onClick={() => void createTrainingPlan()}>Lagre egen plan</button>
          {trainingError ? <p className="message error">{trainingError}</p> : null}

          {trainingSuggestions.length > 0 ? (
            <>
              <p className="tiny">Foreslåtte planer basert på kaloridata:</p>
              <ul className="list">
                {trainingSuggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </>
          ) : null}

          {trainingPlans.length > 0 ? (
            <>
              <p className="tiny">Dine lagrede planer:</p>
              <ul className="list">
                {trainingPlans.map((plan) => (
                  <li key={plan.id}>
                    {plan.planName} - {plan.weeklySessions} økter/uke ({plan.trainingTypes.join(", ")})
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      </section>
    </main>
  );
}
