"use client";

import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../common/api";
import type {
  CalorieInput,
  CalorieSession,
  DietSuggestion,
  StorageMode,
  TrainingDayPlan,
  TrainingPlan
} from "./types";

type HealthResponse = {
  status: string;
  storageMode: StorageMode;
  fallbackActive: boolean;
};

const predefinedTrainingTypes = [
  "Bryst",
  "Rygg",
  "Skuldre",
  "Armer",
  "Kjerne",
  "Bein",
  "Setemuskler"
];

const weekDays = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

const exerciseOptionsByType: Record<string, string[]> = {
  Bryst: ["Benkpress", "Skrå benkpress", "Push-up", "Flyes", "Dips"],
  Rygg: ["Markløft", "Sittende roing", "Nedtrekk", "Pull-up", "Face pull"],
  Skuldre: ["Skulderpress", "Sidehev", "Fronthev", "Omvendt flyes", "Arnold press"],
  Armer: ["Bicepscurl", "Hammercurl", "Triceps pushdown", "Fransk press", "Chins"],
  Kjerne: ["Planke", "Sideplanke", "Dead bug", "Hollow hold", "Pallof press"],
  Bein: ["Knebøy", "Utfall", "Beinpress", "Lårcurl", "Leg extension"],
  Setemuskler: ["Hip thrust", "Glute bridge", "Rumensk markløft", "Cable kickback", "Step-up"]
};

const initialCalorieInput: CalorieInput = {
  currentWeightKg: 85,
  targetWeightKg: 80,
  monthsToGoal: 4,
  activityLevel: "medium"
};

type PumpDashboardProps = {
  userId: string;
  displayName: string;
};

export function PumpDashboard({ userId, displayName }: PumpDashboardProps): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );

  const [storageMode, setStorageMode] = useState<StorageMode>("memory");
  const [healthError, setHealthError] = useState<string | null>(null);

  const [calorieInput, setCalorieInput] = useState<CalorieInput>(initialCalorieInput);
  const [calorieSession, setCalorieSession] = useState<CalorieSession | null>(null);
  const [calorieError, setCalorieError] = useState<string | null>(null);

  const [dietSuggestion, setDietSuggestion] = useState<DietSuggestion | null>(null);
  const [dietError, setDietError] = useState<string | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Bryst"]);
  const [planName, setPlanName] = useState("Min ukeplan");
  const [weeklySessions, setWeeklySessions] = useState(4);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [trainingSuggestions, setTrainingSuggestions] = useState<string[]>([]);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [replacePlansOnNextSave, setReplacePlansOnNextSave] = useState(false);
  const [activeDay, setActiveDay] = useState(weekDays[0]);
  const [customExercise, setCustomExercise] = useState("");
  const [weekPlan, setWeekPlan] = useState<TrainingDayPlan[]>(
    weekDays.map((day) => ({ day, exercises: [], notes: "" }))
  );

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

  useEffect(() => {
    void loadTrainingPlans();
  }, [apiBaseUrl, userId]);

  const availableExercises = useMemo(() => {
    const sourceTypes = selectedTypes.length > 0 ? selectedTypes : predefinedTrainingTypes;
    return [...new Set(sourceTypes.flatMap((type) => exerciseOptionsByType[type] ?? []))];
  }, [selectedTypes]);

  const activeDayPlan = useMemo(
    () => weekPlan.find((day) => day.day === activeDay) ?? weekPlan[0],
    [activeDay, weekPlan]
  );

  const exercisesForActiveDay = useMemo(() => {
    if (!activeDayPlan) {
      return availableExercises;
    }
    return [...new Set([...availableExercises, ...activeDayPlan.exercises])];
  }, [activeDayPlan, availableExercises]);

  const plannedSessionCount = useMemo(
    () => weekPlan.filter((day) => day.exercises.length > 0).length,
    [weekPlan]
  );

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

      const normalizedWeekPlan = weekPlan.map((day) => ({
        day: day.day,
        exercises: day.exercises,
        notes: day.notes?.trim() ? day.notes.trim() : undefined
      }));

      if (normalizedWeekPlan.every((day) => day.exercises.length === 0)) {
        throw new Error("Velg minst én øvelse i ukeplanen før du lagrer");
      }

      const createResponse = await requestJson<{ plan: TrainingPlan }>(
        apiBaseUrl,
        "/api/training/plans",
        {
          method: "POST",
          body: JSON.stringify({
            planName,
            trainingTypes: selectedTypes,
            weeklySessions,
            weekPlan: normalizedWeekPlan
          })
        },
        userId
      );

      if (replacePlansOnNextSave) {
        setTrainingPlans([createResponse.plan]);
        setReplacePlansOnNextSave(false);
      } else {
        await loadTrainingPlans();
      }
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : "Kunne ikke lagre treningsplan");
    }
  }

  async function loadTrainingPlans(): Promise<void> {
    try {
      const listResponse = await requestJson<{ plans: TrainingPlan[] }>(
        apiBaseUrl,
        "/api/training/plans",
        { method: "GET" },
        userId
      );
      setTrainingPlans(listResponse.plans);
    } catch {
      setTrainingPlans([]);
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

  function updateDayPlan(day: string, updater: (current: TrainingDayPlan) => TrainingDayPlan): void {
    setWeekPlan((current) => current.map((item) => (item.day === day ? updater(item) : item)));
  }

  function toggleExercise(day: string, exercise: string): void {
    updateDayPlan(day, (current) => {
      if (current.exercises.includes(exercise)) {
        return {
          ...current,
          exercises: current.exercises.filter((item) => item !== exercise)
        };
      }
      return {
        ...current,
        exercises: [...current.exercises, exercise]
      };
    });
  }

  function addCustomExercise(day: string): void {
    const trimmed = customExercise.trim();
    if (!trimmed) {
      return;
    }

    updateDayPlan(day, (current) => {
      if (current.exercises.includes(trimmed)) {
        return current;
      }
      return {
        ...current,
        exercises: [...current.exercises, trimmed]
      };
    });

    setCustomExercise("");
  }

  function resetTrainingPlan(): void {
    setPlanName("Min ukeplan");
    setWeeklySessions(4);
    setSelectedTypes(["Bryst"]);
    setActiveDay(weekDays[0]);
    setCustomExercise("");
    setTrainingError(null);
    setTrainingSuggestions([]);
    setTrainingPlans([]);
    setReplacePlansOnNextSave(true);
    setWeekPlan(weekDays.map((day) => ({ day, exercises: [], notes: "" })));
  }

  return (
    <main>
      <section className="hero">
        <h1>pump.no</h1>
        <p>
          Nettbasert MVP for profil, kalorikalkulering, kostholdsråd og treningsplaner, bygget med API-først
          arkitektur.
        </p>
        <p className="tiny">Innlogget som: {displayName}</p>
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
        <article className="card span-12">
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
          <p className="tiny">Planlagte dager med økter: {plannedSessionCount} av 7</p>

          <p className="tiny">Velg muskelgrupper for planen:</p>
          <div className="row two">
            {predefinedTrainingTypes.map((type) => (
              <label key={type} className="checkbox-inline">
                <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleTrainingType(type)} />
                {type}
              </label>
            ))}
          </div>

          <p className="tiny">Bygg ukeplan manuelt - velg dag og klikk øvelser for muskelgruppen:</p>
          <div className="day-tabs" role="tablist" aria-label="Velg dag i ukeplan">
            {weekDays.map((day) => (
              <button
                key={day}
                type="button"
                className={`secondary day-tab ${activeDay === day ? "active" : ""}`}
                onClick={() => setActiveDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {activeDayPlan ? (
            <div className="message">
              <p className="tiny strong">{activeDayPlan.day}</p>
              <div className="exercise-grid">
                {exercisesForActiveDay.map((exercise) => {
                  const selected = activeDayPlan.exercises.includes(exercise);
                  return (
                    <button
                      key={exercise}
                      type="button"
                      className={`secondary exercise-chip ${selected ? "selected" : ""}`}
                      onClick={() => toggleExercise(activeDayPlan.day, exercise)}
                    >
                      {exercise}
                    </button>
                  );
                })}
              </div>

              <div className="row two">
                <label>
                  Legg til egen øvelse
                  <input
                    value={customExercise}
                    onChange={(event) => setCustomExercise(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomExercise(activeDayPlan.day);
                      }
                    }}
                    placeholder="For eksempel: Hip thrust"
                  />
                </label>
                <button type="button" className="secondary" onClick={() => addCustomExercise(activeDayPlan.day)}>
                  Legg til øvelse
                </button>
              </div>

              <label>
                Notater for {activeDayPlan.day}
                <textarea
                  value={activeDayPlan.notes ?? ""}
                  onChange={(event) =>
                    updateDayPlan(activeDayPlan.day, (current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                  placeholder="Intensitet, varighet eller fokus"
                />
              </label>
            </div>
          ) : null}

          <div className="actions">
            <button onClick={() => void createTrainingPlan()}>Lagre egen plan</button>
            <button type="button" className="reset-plan-button" onClick={resetTrainingPlan}>
              reset plan
            </button>
          </div>
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
              <ul className="list plans-list">
                {trainingPlans.map((plan) => (
                  <li key={plan.id} className="plan-item">
                    <p>
                      <strong>{plan.planName}</strong> - {plan.weeklySessions} økter/uke ({plan.trainingTypes.join(", ")})
                    </p>
                    {plan.weekPlan?.length ? (
                      <div className="week-plan-grid">
                        {plan.weekPlan.map((day) => (
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
                            {day.notes ? <p className="tiny">Notat: {day.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
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
