"use client";

import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../common/api";
import type {
  CalorieInput,
  CalorieSession,
  DietPlan,
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

type ManualMealDraft = {
  id: string;
  name: string;
  details: string;
};

const defaultMealNames = ["Frokost", "Lunsj", "Middag", "Kveldsmat", "Mellommåltid 1", "Mellommåltid 2"];

function createManualMealDraft(index: number): ManualMealDraft {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    name: defaultMealNames[index] ?? `Måltid ${index + 1}`,
    details: ""
  };
}

function buildManualMealDrafts(count: number): ManualMealDraft[] {
  return Array.from({ length: count }, (_, index) => createManualMealDraft(index));
}

function formatManualMeals(meals: ManualMealDraft[]): string[] {
  return meals
    .map((meal) => {
      const name = meal.name.trim();
      const details = meal.details.trim();

      if (!name && !details) {
        return null;
      }

      if (!name) {
        return details;
      }

      if (!details) {
        return name;
      }

      return `${name}: ${details}`;
    })
    .filter((meal): meal is string => Boolean(meal));
}

type TrainingProgramTemplate = {
  id: string;
  name: string;
  description: string;
  planName: string;
  trainingTypes: string[];
  weeklySessions: number;
  weekPlan: TrainingDayPlan[];
};

type PendingTrainingDeletion = {
  index: number;
  plan: TrainingPlan;
};

const trainingProgramTemplates: TrainingProgramTemplate[] = [
  {
    id: "nybegynner",
    name: "Nybegynner 3-dager",
    description: "En enkel fullkroppsplan med god balanse og hvile mellom økter.",
    planName: "Nybegynner 3-dager",
    trainingTypes: ["Bryst", "Rygg", "Bein", "Kjerne"],
    weeklySessions: 3,
    weekPlan: [
      { day: "Mandag", exercises: ["Knebøy", "Benkpress", "Planke"], notes: "Helkropp, rolig start" },
      { day: "Tirsdag", exercises: [], notes: "Hvile eller lett mobilitet" },
      { day: "Onsdag", exercises: ["Markløft", "Nedtrekk", "Sideplanke"], notes: "Fokus på teknikk" },
      { day: "Torsdag", exercises: [], notes: "Hvile" },
      { day: "Fredag", exercises: ["Utfall", "Skulderpress", "Dead bug"], notes: "Jevn kontroll" },
      { day: "Lørdag", exercises: [], notes: "Aktiv hvile" },
      { day: "Søndag", exercises: [], notes: "Hvile" }
    ]
  },
  {
    id: "styrke",
    name: "Styrke 4-dager",
    description: "Mer belastning på baseøvelser med over/underkropp-splitt.",
    planName: "Styrke 4-dager",
    trainingTypes: ["Bryst", "Rygg", "Bein", "Skuldre", "Kjerne"],
    weeklySessions: 4,
    weekPlan: [
      { day: "Mandag", exercises: ["Benkpress", "Sittende roing", "Face pull"], notes: "Overkropp tung" },
      { day: "Tirsdag", exercises: ["Knebøy", "Beinpress", "Leg extension"], notes: "Underkropp tung" },
      { day: "Onsdag", exercises: [], notes: "Hvile" },
      { day: "Torsdag", exercises: ["Skulderpress", "Pull-up", "Pallof press"], notes: "Overkropp volum" },
      { day: "Fredag", exercises: ["Markløft", "Utfall", "Lårcurl"], notes: "Underkropp volum" },
      { day: "Lørdag", exercises: [], notes: "Valgfri mobilitet" },
      { day: "Søndag", exercises: [], notes: "Hvile" }
    ]
  },
  {
    id: "hypertrofi",
    name: "Hypertrofi 5-dager",
    description: "Høyere treningsvolum for muskelvekst med målrettede økter.",
    planName: "Hypertrofi 5-dager",
    trainingTypes: ["Bryst", "Rygg", "Skuldre", "Armer", "Bein", "Setemuskler", "Kjerne"],
    weeklySessions: 5,
    weekPlan: [
      { day: "Mandag", exercises: ["Skrå benkpress", "Flyes", "Triceps pushdown"], notes: "Push-fokus" },
      { day: "Tirsdag", exercises: ["Nedtrekk", "Sittende roing", "Hammercurl"], notes: "Pull-fokus" },
      { day: "Onsdag", exercises: ["Knebøy", "Hip thrust", "Lårcurl"], notes: "Leg day" },
      { day: "Torsdag", exercises: ["Skulderpress", "Sidehev", "Omvendt flyes"], notes: "Skuldre" },
      { day: "Fredag", exercises: ["Glute bridge", "Utfall", "Planke"], notes: "Sete og kjerne" },
      { day: "Lørdag", exercises: [], notes: "Aktiv restitusjon" },
      { day: "Søndag", exercises: [], notes: "Hvile" }
    ]
  },
  {
    id: "fettforbrenning",
    name: "Fettforbrenning 4-dager",
    description: "Kombinerer styrke og høy puls for effektiv energibruk.",
    planName: "Fettforbrenning 4-dager",
    trainingTypes: ["Bein", "Bryst", "Rygg", "Kjerne", "Setemuskler"],
    weeklySessions: 4,
    weekPlan: [
      { day: "Mandag", exercises: ["Utfall", "Push-up", "Planke"], notes: "Sirkel 3-4 runder" },
      { day: "Tirsdag", exercises: ["Markløft", "Nedtrekk", "Dead bug"], notes: "Moderate pauser" },
      { day: "Onsdag", exercises: [], notes: "Gåtur 30-45 min" },
      { day: "Torsdag", exercises: ["Knebøy", "Skulderpress", "Sideplanke"], notes: "Helkropp" },
      { day: "Fredag", exercises: ["Hip thrust", "Sittende roing", "Pallof press"], notes: "Tempo-kontroll" },
      { day: "Lørdag", exercises: [], notes: "Valgfri lett aktivitet" },
      { day: "Søndag", exercises: [], notes: "Hvile" }
    ]
  }
];

type PumpDashboardProps = {
  userId?: string;
  displayName?: string;
  view?: "all" | "calories" | "diet" | "nutrition" | "training";
};

export function PumpDashboard({ userId, displayName, view = "all" }: PumpDashboardProps): JSX.Element {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
    []
  );
  const effectiveUserId = userId?.trim() || "demo-user";
  const effectiveDisplayName = displayName?.trim() || "Demo bruker";

  const [storageMode, setStorageMode] = useState<StorageMode>("memory");
  const [healthError, setHealthError] = useState<string | null>(null);

  const [calorieInput, setCalorieInput] = useState<CalorieInput>(initialCalorieInput);
  const [calorieSession, setCalorieSession] = useState<CalorieSession | null>(null);
  const [calorieError, setCalorieError] = useState<string | null>(null);
  const [calorieSuccess, setCalorieSuccess] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [dietSuggestion, setDietSuggestion] = useState<DietSuggestion | null>(null);
  const [dietError, setDietError] = useState<string | null>(null);
  const [dietPlanSuccess, setDietPlanSuccess] = useState<string | null>(null);
  const [isSavingDietPlan, setIsSavingDietPlan] = useState(false);
  const [dietPlanName, setDietPlanName] = useState("Min kostholdplan");
  const [dietPlanNotes, setDietPlanNotes] = useState("");
  const [manualMeals, setManualMeals] = useState<ManualMealDraft[]>(() => buildManualMealDrafts(4));
  const [mealCount, setMealCount] = useState(4);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Bryst"]);
  const [planName, setPlanName] = useState("Min ukeplan");
  const [weeklySessions, setWeeklySessions] = useState(4);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [trainingSuggestions, setTrainingSuggestions] = useState<string[]>([]);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [pendingTrainingDeletion, setPendingTrainingDeletion] = useState<PendingTrainingDeletion | null>(null);
  const [replacePlansOnNextSave, setReplacePlansOnNextSave] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
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
  }, [apiBaseUrl, effectiveUserId]);

  useEffect(() => {
    void loadDietPlans();
  }, [apiBaseUrl, effectiveUserId]);

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
  const showCalories = view === "all" || view === "calories" || view === "nutrition";
  const showDiet = view === "all" || view === "diet" || view === "nutrition";
  const showTraining = view === "all" || view === "training";

  const nutritionTargets = useMemo(() => {
    if (!calorieSession) {
      return null;
    }

    const calories = calorieSession.result.dailyCalories;
    const proteinGrams = Math.round(Math.max(1.6 * calorieInput.targetWeightKg, 1.3 * calorieInput.currentWeightKg));
    const fatGrams = Math.round((calories * 0.28) / 9);
    const carbGrams = Math.max(0, Math.round((calories - proteinGrams * 4 - fatGrams * 9) / 4));
    const waterLiters = Math.max(2, Number((calorieInput.currentWeightKg * 0.035).toFixed(1)));
    const fiberGrams = Math.round((calories / 1000) * 14);

    return {
      calories,
      proteinGrams,
      fatGrams,
      carbGrams,
      waterLiters,
      fiberGrams
    };
  }, [calorieInput.currentWeightKg, calorieInput.targetWeightKg, calorieSession]);

  const caloriesPerMeal = useMemo(() => {
    if (!nutritionTargets) {
      return null;
    }

    return Math.round(nutritionTargets.calories / mealCount);
  }, [mealCount, nutritionTargets]);

  const manualMealPreview = useMemo(() => formatManualMeals(manualMeals), [manualMeals]);

  useEffect(() => {
    setManualMeals((current) => {
      const trimmed = current.slice(0, mealCount);

      if (trimmed.length === mealCount) {
        return current;
      }

      const missingCount = mealCount - trimmed.length;
      const appended = Array.from({ length: missingCount }, (_, index) => createManualMealDraft(trimmed.length + index));
      return [...trimmed, ...appended];
    });
  }, [mealCount]);

  const grocerySuggestions = useMemo(() => {
    if (!dietSuggestion) {
      return [];
    }

    const text = dietSuggestion.meals.join(" ").toLowerCase();
    const suggestions = new Set<string>();
    const mappings: Array<{ key: string; items: string[] }> = [
      { key: "havre", items: ["Havregryn", "Banan", "Kanel"] },
      { key: "kylling", items: ["Kyllingfilet", "Ris", "Brokkoli"] },
      { key: "laks", items: ["Laks", "Potet", "Grønne grønnsaker"] },
      { key: "egg", items: ["Egg", "Fullkornsbrød", "Avokado"] },
      { key: "yoghurt", items: ["Gresk yoghurt", "Bær", "Nøtter"] },
      { key: "smoothie", items: ["Frosne bær", "Banan", "Proteinpulver"] }
    ];

    mappings.forEach((mapping) => {
      if (text.includes(mapping.key)) {
        mapping.items.forEach((item) => suggestions.add(item));
      }
    });

    if (suggestions.size === 0) {
      ["Proteinkilde", "Karbohydratkilde", "Grønnsaker", "Frukt", "Sunt fett"].forEach((item) =>
        suggestions.add(item)
      );
    }

    return [...suggestions];
  }, [dietSuggestion]);

  async function runCalorieCalculation(): Promise<void> {
    try {
      setIsCalculating(true);
      setCalorieError(null);
      setCalorieSuccess(null);
      const response = await requestJson<{ session: CalorieSession }>(
        apiBaseUrl,
        "/api/calories/calculate",
        {
          method: "POST",
          body: JSON.stringify(calorieInput)
        },
        effectiveUserId
      );
      setCalorieSession(response.session);

      const dietResponse = await requestJson<{ suggestion: DietSuggestion }>(
        apiBaseUrl,
        `/api/diets/suggestions?dailyCalories=${response.session.result.dailyCalories}`,
        { method: "GET" },
        effectiveUserId
      );
      setDietSuggestion(dietResponse.suggestion);
      setDietError(null);

      const trainingResponse = await requestJson<{ suggestions: string[] }>(
        apiBaseUrl,
        `/api/training/suggestions?dailyCalories=${response.session.result.dailyCalories}`,
        { method: "GET" },
        effectiveUserId
      );
      setTrainingSuggestions(trainingResponse.suggestions);
      setCalorieSuccess("Kalori- og kostholdsgrunnlag er oppdatert.");
    } catch (error) {
      setCalorieError(error instanceof Error ? error.message : "Kalkulering feilet");
    } finally {
      setIsCalculating(false);
    }
  }

  async function createTrainingPlan(): Promise<void> {
    try {
      setIsSavingPlan(true);
      setTrainingError(null);
      setTrainingSuccess(null);

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
        effectiveUserId
      );

      if (replacePlansOnNextSave) {
        setTrainingPlans([createResponse.plan]);
        setReplacePlansOnNextSave(false);
      } else {
        await loadTrainingPlans();
      }
      setTrainingSuccess("Planen ble lagret.");
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : "Kunne ikke lagre treningsplan");
    } finally {
      setIsSavingPlan(false);
    }
  }

  async function saveDietPlanFromSuggestion(): Promise<void> {
    try {
      if (!dietSuggestion) {
        throw new Error("Kjør kalorikalkulering og hent forslag først");
      }

      setIsSavingDietPlan(true);
      setDietError(null);
      setDietPlanSuccess(null);

      const response = await requestJson<{ plan: DietPlan }>(
        apiBaseUrl,
        "/api/diets/plans",
        {
          method: "POST",
          body: JSON.stringify({
            sourceType: "from-suggestion",
            dailyCalories: dietSuggestion.dailyCalories,
            planName: dietPlanName.trim() || dietSuggestion.dietName,
            notes: dietPlanNotes.trim() || undefined
          })
        },
        effectiveUserId
      );

      setDietPlanSuccess(`Lagret kostholdplan: ${response.plan.planName}`);
      setDietPlans((current) => [response.plan, ...current]);
    } catch (error) {
      setDietError(error instanceof Error ? error.message : "Kunne ikke lagre kostholdplan");
    } finally {
      setIsSavingDietPlan(false);
    }
  }

  async function saveManualDietPlan(): Promise<void> {
    try {
      const meals = formatManualMeals(manualMeals);

      if (!dietPlanName.trim()) {
        throw new Error("Skriv inn et navn på kostholdplanen");
      }

      if (meals.length === 0) {
        throw new Error("Legg inn minst ett måltid i den manuelle planen");
      }

      setIsSavingDietPlan(true);
      setDietError(null);
      setDietPlanSuccess(null);

      const response = await requestJson<{ plan: DietPlan }>(
        apiBaseUrl,
        "/api/diets/plans",
        {
          method: "POST",
          body: JSON.stringify({
            sourceType: "manual",
            planName: dietPlanName.trim(),
            meals,
            dailyCalories: nutritionTargets?.calories,
            notes: dietPlanNotes.trim() || undefined
          })
        },
        effectiveUserId
      );

      setDietPlanSuccess(`Lagret manuell kostholdplan: ${response.plan.planName}`);
      setDietPlans((current) => [response.plan, ...current]);
      setManualMeals(buildManualMealDrafts(mealCount));
    } catch (error) {
      setDietError(error instanceof Error ? error.message : "Kunne ikke lagre kostholdplan");
    } finally {
      setIsSavingDietPlan(false);
    }
  }

  function updateManualMeal(mealId: string, field: "name" | "details", value: string): void {
    setManualMeals((current) =>
      current.map((meal) => {
        if (meal.id !== mealId) {
          return meal;
        }

        return {
          ...meal,
          [field]: value
        };
      })
    );
  }

  function resetManualMeals(): void {
    setManualMeals(buildManualMealDrafts(mealCount));
  }

  function fillManualMealsFromSuggestion(): void {
    if (dietSuggestion?.meals.length) {
      setManualMeals((current) =>
        current.map((meal, index) => {
          const suggestionMeal = dietSuggestion.meals[index];
          if (!suggestionMeal) {
            return meal;
          }

          const [suggestedName, ...rest] = suggestionMeal.split(":");
          if (rest.length === 0) {
            return {
              ...meal,
              details: suggestionMeal.trim()
            };
          }

          return {
            ...meal,
            name: suggestedName.trim() || meal.name,
            details: rest.join(":").trim()
          };
        })
      );
      return;
    }

    if (!caloriesPerMeal) {
      return;
    }

    setManualMeals((current) =>
      current.map((meal) => ({
        ...meal,
        details: `Mål: ca. ${caloriesPerMeal} kcal` 
      }))
    );
  }

  async function loadTrainingPlans(): Promise<void> {
    try {
      const listResponse = await requestJson<{ plans: TrainingPlan[] }>(
        apiBaseUrl,
        "/api/training/plans",
        { method: "GET" },
        effectiveUserId
      );
      setTrainingPlans(listResponse.plans);
    } catch {
      setTrainingPlans([]);
    }
  }

  async function loadDietPlans(): Promise<void> {
    try {
      const listResponse = await requestJson<{ plans: DietPlan[] }>(
        apiBaseUrl,
        "/api/diets/plans",
        { method: "GET" },
        effectiveUserId
      );
      setDietPlans(listResponse.plans);
    } catch {
      setDietPlans([]);
    }
  }

  function restorePendingTrainingPlan(deletion: PendingTrainingDeletion): void {
    setTrainingPlans((current) => {
      const next = [...current];
      next.splice(deletion.index, 0, deletion.plan);
      return next;
    });
  }

  async function commitTrainingDeletion(deletion: PendingTrainingDeletion): Promise<void> {
    try {
      setTrainingError(null);
      setTrainingSuccess(null);

      await requestJson<{ deleted: boolean }>(
        apiBaseUrl,
        `/api/training/plans/${deletion.plan.id}`,
        { method: "DELETE" },
        effectiveUserId
      );

      setTrainingSuccess("Treningsplanen ble slettet permanent.");
    } catch (error) {
      restorePendingTrainingPlan(deletion);
      setTrainingError(error instanceof Error ? error.message : "Kunne ikke slette treningsplan");
    } finally {
      setPendingTrainingDeletion((current) => {
        if (!current) {
          return null;
        }

        if (current.plan.id === deletion.plan.id) {
          return null;
        }

        return current;
      });
    }
  }

  useEffect(() => {
    if (!pendingTrainingDeletion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void commitTrainingDeletion(pendingTrainingDeletion);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingTrainingDeletion, apiBaseUrl, effectiveUserId]);

  function requestTrainingDeletion(planId: string): void {
    if (pendingTrainingDeletion) {
      setTrainingError("Fullfør eller angre forrige sletting før du sletter en ny plan.");
      return;
    }

    const index = trainingPlans.findIndex((plan) => plan.id === planId);
    if (index < 0) {
      return;
    }

    const plan = trainingPlans[index];
    setTrainingPlans((current) => current.filter((item) => item.id !== planId));
    setPendingTrainingDeletion({ index, plan });
    setTrainingError(null);
    setTrainingSuccess("Treningsplan markert for sletting. Angre innen 5 sekunder.");
  }

  function undoTrainingDeletion(): void {
    if (!pendingTrainingDeletion) {
      return;
    }

    restorePendingTrainingPlan(pendingTrainingDeletion);
    setPendingTrainingDeletion(null);
    setTrainingError(null);
    setTrainingSuccess("Sletting ble angret.");
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

  function applyTrainingProgram(template: TrainingProgramTemplate): void {
    setSelectedTemplateId(template.id);
    setPlanName(template.planName);
    setWeeklySessions(template.weeklySessions);
    setSelectedTypes(template.trainingTypes);
    setActiveDay(weekDays[0]);
    setCustomExercise("");
    setTrainingError(null);
    setWeekPlan(template.weekPlan.map((day) => ({ ...day })));
  }

  function resetTrainingPlan(): void {
    setPlanName("Min ukeplan");
    setWeeklySessions(4);
    setSelectedTypes(["Bryst"]);
    setSelectedTemplateId(null);
    setActiveDay(weekDays[0]);
    setCustomExercise("");
    setTrainingError(null);
    setTrainingSuccess(null);
    setTrainingSuggestions([]);
    setTrainingPlans([]);
    setReplacePlansOnNextSave(true);
    setWeekPlan(weekDays.map((day) => ({ day, exercises: [], notes: "" })));
  }

  return (
    <main>
      <section className="hero">
        <h1 className="brand-mark" aria-label="pump.no">
          <span className="brand-pill">Tren smartere</span>
          <span className="brand-word">pump</span>
          <span className="brand-dot">.</span>
          <span className="brand-word">no</span>
        </h1>
        <p>
          Nettbasert MVP for profil, kalorikalkulering, kostholdsråd og treningsplaner, bygget med API-først
          arkitektur.
        </p>
        <p className="tiny">Innlogget som: {effectiveDisplayName}</p>
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
        {showCalories ? (
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
          <button disabled={isCalculating} onClick={() => void runCalorieCalculation()}>
            {isCalculating ? "Beregner..." : "Beregn daglig inntak"}
          </button>
          {calorieError ? <p className="message error">{calorieError}</p> : null}
          {calorieSuccess ? <p className="message success">{calorieSuccess}</p> : null}
          {isCalculating ? <p className="message">Henter kaloridata og forslag...</p> : null}
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
        ) : null}

        {showDiet ? (
        <article className={`card ${showTraining ? "span-6" : "span-12"}`}>
          <h2>Kosthold og diettforslag</h2>
          <label>
            Antall måltider per dag
            <select value={mealCount} onChange={(event) => setMealCount(Number(event.target.value))}>
              <option value={3}>3 måltider</option>
              <option value={4}>4 måltider</option>
              <option value={5}>5 måltider</option>
              <option value={6}>6 måltider</option>
            </select>
          </label>

          {nutritionTargets ? (
            <div className="message nutrition-kpis">
              <p className="tiny strong">Daglige mål</p>
              <div className="kpi-grid">
                <p><strong>{nutritionTargets.calories}</strong> kcal</p>
                <p><strong>{nutritionTargets.proteinGrams} g</strong> protein</p>
                <p><strong>{nutritionTargets.carbGrams} g</strong> karbohydrat</p>
                <p><strong>{nutritionTargets.fatGrams} g</strong> fett</p>
                <p><strong>{nutritionTargets.waterLiters} L</strong> vann</p>
                <p><strong>{nutritionTargets.fiberGrams} g</strong> fiber</p>
              </div>
              {caloriesPerMeal ? (
                <p className="tiny">Mål per måltid ved {mealCount} måltider: ca. {caloriesPerMeal} kcal.</p>
              ) : null}
            </div>
          ) : (
            <p className="tiny">Kjør kalorikalkulering først for å få konkrete kostholdsmål.</p>
          )}

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

              <div className="message">
                <p className="tiny strong">Forslag til handleliste</p>
                <ul className="list compact">
                  {grocerySuggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="message">
                <p className="tiny strong">Lagre forslag som kostholdplan</p>
                <label>
                  Navn på kostholdplan
                  <input value={dietPlanName} onChange={(event) => setDietPlanName(event.target.value)} />
                </label>
                <label>
                  Notater (valgfritt)
                  <textarea
                    value={dietPlanNotes}
                    onChange={(event) => setDietPlanNotes(event.target.value)}
                    placeholder="Hva vil du fokusere på i denne planen?"
                  />
                </label>
                <button type="button" disabled={isSavingDietPlan} onClick={() => void saveDietPlanFromSuggestion()}>
                  {isSavingDietPlan ? "Lagrer kostholdplan..." : "Lagre dette forslaget"}
                </button>
              </div>
            </>
          ) : (
            <p className="tiny">Kjør kalorikalkulering for å hente forslag.</p>
          )}

          <div className="message">
            <p className="tiny strong">Eller lag manuell kostholdplan</p>
            <p className="tiny">
              Bygg spiseplanen måltid for måltid. {caloriesPerMeal ? `Mål per måltid: ca. ${caloriesPerMeal} kcal.` : "Kjør kaloriutregning for kcal-mål per måltid."}
            </p>

            <div className="manual-meal-grid">
              {manualMeals.map((meal, index) => (
                <div key={meal.id} className="manual-meal-card">
                  <p className="tiny strong">Måltid {index + 1}</p>
                  <label>
                    Navn
                    <input
                      value={meal.name}
                      onChange={(event) => updateManualMeal(meal.id, "name", event.target.value)}
                      placeholder={`Måltid ${index + 1}`}
                    />
                  </label>
                  <label>
                    Innhold
                    <textarea
                      value={meal.details}
                      onChange={(event) => updateManualMeal(meal.id, "details", event.target.value)}
                      placeholder="For eksempel: Havregrøt med bær og yoghurt"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="actions manual-meal-actions">
              <button type="button" className="secondary" onClick={fillManualMealsFromSuggestion}>
                Fyll inn forslag
              </button>
              <button type="button" className="secondary" onClick={resetManualMeals}>
                Tøm måltider
              </button>
              <button type="button" disabled={isSavingDietPlan} onClick={() => void saveManualDietPlan()}>
                {isSavingDietPlan ? "Lagrer kostholdplan..." : "Lagre manuell plan"}
              </button>
            </div>

            {manualMealPreview.length > 0 ? (
              <>
                <p className="tiny strong">Plan-preview</p>
                <ul className="list compact">
                  {manualMealPreview.map((meal) => (
                    <li key={meal}>{meal}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          {dietError ? <p className="message error">{dietError}</p> : null}
          {dietPlanSuccess ? <p className="message success">{dietPlanSuccess}</p> : null}
        </article>
        ) : null}

        {showTraining ? (
        <article className="card span-6">
          <h2>Treningsplaner</h2>
          <p className="tiny">Velg et ferdig program og tilpass det videre:</p>
          <div className="template-grid">
            {trainingProgramTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`secondary template-card ${selectedTemplateId === template.id ? "active" : ""}`}
                onClick={() => applyTrainingProgram(template)}
              >
                <span className="strong">{template.name}</span>
                <span className="tiny">{template.description}</span>
              </button>
            ))}
          </div>

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
            <button disabled={isSavingPlan} onClick={() => void createTrainingPlan()}>
              {isSavingPlan ? "Lagrer plan..." : "Lagre egen plan"}
            </button>
            <button type="button" className="reset-plan-button" onClick={resetTrainingPlan}>
              Nullstill plan
            </button>
          </div>
          {trainingError ? <p className="message error">{trainingError}</p> : null}
          {trainingSuccess ? <p className="message success">{trainingSuccess}</p> : null}
          {pendingTrainingDeletion ? (
            <div className="message warning undo-banner">
              <p>Treningsplanen slettes permanent om 5 sekunder.</p>
              <button type="button" className="secondary" onClick={undoTrainingDeletion}>
                Angre sletting
              </button>
            </div>
          ) : null}

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
                    <div className="plan-item-head">
                      <p>
                        <strong>{plan.planName}</strong> - {plan.weeklySessions} økter/uke ({plan.trainingTypes.join(", ")})
                      </p>
                      <button
                        type="button"
                        className="secondary"
                        disabled={Boolean(pendingTrainingDeletion)}
                        onClick={() => requestTrainingDeletion(plan.id)}
                      >
                        Slett plan
                      </button>
                    </div>
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
        ) : null}
      </section>
    </main>
  );
}
