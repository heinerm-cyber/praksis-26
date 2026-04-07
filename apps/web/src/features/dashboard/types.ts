export type StorageMode = "cosmos" | "memory";

export type Profile = {
  id: string;
  userId: string;
  createdAt: string;
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

export type CalorieSession = {
  id: string;
  userId: string;
  createdAt: string;
  input: CalorieInput;
  result: CalorieResult;
};

export type DietSuggestion = {
  id: string;
  userId: string;
  createdAt: string;
  dailyCalories: number;
  meals: string[];
  dietName: string;
};

export type TrainingPlan = {
  id: string;
  userId: string;
  createdAt: string;
  planName: string;
  trainingTypes: string[];
  weeklySessions: number;
  suggestedByCalories: boolean;
};
