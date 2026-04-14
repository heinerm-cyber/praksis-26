import type {
  CalorieSession,
  DietPlan,
  DietSuggestion,
  Profile,
  StorageMode,
  TrainingPlan
} from "../domain/models.js";

export interface ProfileRepository {
  upsert(profile: Profile): Promise<Profile>;
  getByUserId(userId: string): Promise<Profile | null>;
}

export interface CalorieRepository {
  create(session: CalorieSession): Promise<CalorieSession>;
  listByUserId(userId: string): Promise<CalorieSession[]>;
}

export interface DietRepository {
  create(suggestion: DietSuggestion): Promise<DietSuggestion>;
  listByUserId(userId: string): Promise<DietSuggestion[]>;
}

export interface DietPlanRepository {
  create(plan: DietPlan): Promise<DietPlan>;
  listByUserId(userId: string): Promise<DietPlan[]>;
}

export interface TrainingRepository {
  create(plan: TrainingPlan): Promise<TrainingPlan>;
  listByUserId(userId: string): Promise<TrainingPlan[]>;
}

export interface StorageProvider {
  mode: StorageMode;
  profile: ProfileRepository;
  calories: CalorieRepository;
  diets: DietRepository;
  dietPlans: DietPlanRepository;
  training: TrainingRepository;
}
