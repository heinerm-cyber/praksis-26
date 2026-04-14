export type StorageMode = "cosmos" | "memory";

export type UserScopedEntity = {
  id: string;
  userId: string;
  createdAt: string;
};

export type Profile = UserScopedEntity & {
  name: string;
  email: string;
};

export type CalorieInput = {
  currentWeightKg: number;
  targetWeightKg: number;
  monthsToGoal: number;
  activityLevel: "low" | "medium" | "high";
};

export type CalorieResult = {
  dailyCalories: number;
  monthlyChangeKg: number;
  notes: string[];
};

export type CalorieSession = UserScopedEntity & {
  input: CalorieInput;
  result: CalorieResult;
};

export type DietSuggestion = UserScopedEntity & {
  dailyCalories: number;
  meals: string[];
  dietName: string;
};

export type DietPlan = UserScopedEntity & {
  planName: string;
  meals: string[];
  sourceType: "manual" | "from-suggestion";
  dailyCalories?: number;
  dietName?: string;
  notes?: string;
};

export type TrainingDayPlan = {
  day: string;
  exercises: string[];
  notes?: string;
};

export type TrainingPlan = UserScopedEntity & {
  planName: string;
  trainingTypes: string[];
  weeklySessions: number;
  weekPlan: TrainingDayPlan[];
  suggestedByCalories: boolean;
};
