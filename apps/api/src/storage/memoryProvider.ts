import type {
  CalorieSession,
  DietPlan,
  DietSuggestion,
  Profile,
  TrainingPlan
} from "../domain/models.js";
import type {
  CalorieRepository,
  DietPlanRepository,
  DietRepository,
  ProfileRepository,
  StorageProvider,
  TrainingRepository
} from "./types.js";

class MemoryProfileRepository implements ProfileRepository {
  private readonly map = new Map<string, Profile>();

  async upsert(profile: Profile): Promise<Profile> {
    this.map.set(profile.userId, profile);
    return profile;
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    return this.map.get(userId) ?? null;
  }
}

class MemoryCalorieRepository implements CalorieRepository {
  private readonly map = new Map<string, CalorieSession[]>();

  async create(session: CalorieSession): Promise<CalorieSession> {
    const current = this.map.get(session.userId) ?? [];
    this.map.set(session.userId, [session, ...current]);
    return session;
  }

  async listByUserId(userId: string): Promise<CalorieSession[]> {
    return this.map.get(userId) ?? [];
  }
}

class MemoryDietRepository implements DietRepository {
  private readonly map = new Map<string, DietSuggestion[]>();

  async create(suggestion: DietSuggestion): Promise<DietSuggestion> {
    const current = this.map.get(suggestion.userId) ?? [];
    this.map.set(suggestion.userId, [suggestion, ...current]);
    return suggestion;
  }

  async listByUserId(userId: string): Promise<DietSuggestion[]> {
    return this.map.get(userId) ?? [];
  }
}

class MemoryDietPlanRepository implements DietPlanRepository {
  private readonly map = new Map<string, DietPlan[]>();

  async create(plan: DietPlan): Promise<DietPlan> {
    const current = this.map.get(plan.userId) ?? [];
    this.map.set(plan.userId, [plan, ...current]);
    return plan;
  }

  async listByUserId(userId: string): Promise<DietPlan[]> {
    return this.map.get(userId) ?? [];
  }
}

class MemoryTrainingRepository implements TrainingRepository {
  private readonly map = new Map<string, TrainingPlan[]>();

  async create(plan: TrainingPlan): Promise<TrainingPlan> {
    const current = this.map.get(plan.userId) ?? [];
    this.map.set(plan.userId, [plan, ...current]);
    return plan;
  }

  async listByUserId(userId: string): Promise<TrainingPlan[]> {
    return this.map.get(userId) ?? [];
  }
}

export function createMemoryProvider(): StorageProvider {
  return {
    mode: "memory",
    profile: new MemoryProfileRepository(),
    calories: new MemoryCalorieRepository(),
    diets: new MemoryDietRepository(),
    dietPlans: new MemoryDietPlanRepository(),
    training: new MemoryTrainingRepository()
  };
}
