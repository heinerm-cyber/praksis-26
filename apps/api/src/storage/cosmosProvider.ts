import { CosmosClient } from "@azure/cosmos";
import type {
  CalorieSession,
  DietPlan,
  DietSuggestion,
  Profile,
  TrainingPlan
} from "../domain/models.js";
import type { AppEnv } from "../config/env.js";
import type {
  CalorieRepository,
  DietPlanRepository,
  DietRepository,
  ProfileRepository,
  StorageProvider,
  TrainingRepository
} from "./types.js";

type ContainerConfig = {
  database: string;
  profiles: string;
  calories: string;
  diets: string;
  dietPlans: string;
  training: string;
};

function isCosmosNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybe = error as { code?: number; statusCode?: number };
  return maybe.code === 404 || maybe.statusCode === 404;
}

class CosmosProfileRepository implements ProfileRepository {
  constructor(private readonly client: CosmosClient, private readonly cfg: ContainerConfig) {}

  async upsert(profile: Profile): Promise<Profile> {
    const container = this.client.database(this.cfg.database).container(this.cfg.profiles);
    await container.items.upsert(profile);
    return profile;
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    const container = this.client.database(this.cfg.database).container(this.cfg.profiles);
    const query = {
      query: "SELECT TOP 1 * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query<Profile>(query).fetchAll();
    return resources[0] ?? null;
  }
}

class CosmosCalorieRepository implements CalorieRepository {
  constructor(private readonly client: CosmosClient, private readonly cfg: ContainerConfig) {}

  async create(session: CalorieSession): Promise<CalorieSession> {
    const container = this.client.database(this.cfg.database).container(this.cfg.calories);
    await container.items.upsert(session);
    return session;
  }

  async listByUserId(userId: string): Promise<CalorieSession[]> {
    const container = this.client.database(this.cfg.database).container(this.cfg.calories);
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query<CalorieSession>(query).fetchAll();
    return resources;
  }
}

class CosmosDietRepository implements DietRepository {
  constructor(private readonly client: CosmosClient, private readonly cfg: ContainerConfig) {}

  async create(suggestion: DietSuggestion): Promise<DietSuggestion> {
    const container = this.client.database(this.cfg.database).container(this.cfg.diets);
    await container.items.upsert(suggestion);
    return suggestion;
  }

  async listByUserId(userId: string): Promise<DietSuggestion[]> {
    const container = this.client.database(this.cfg.database).container(this.cfg.diets);
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query<DietSuggestion>(query).fetchAll();
    return resources;
  }
}

class CosmosDietPlanRepository implements DietPlanRepository {
  constructor(private readonly client: CosmosClient, private readonly cfg: ContainerConfig) {}

  async create(plan: DietPlan): Promise<DietPlan> {
    const container = this.client.database(this.cfg.database).container(this.cfg.dietPlans);
    await container.items.upsert(plan);
    return plan;
  }

  async listByUserId(userId: string): Promise<DietPlan[]> {
    const container = this.client.database(this.cfg.database).container(this.cfg.dietPlans);
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query<DietPlan>(query).fetchAll();
    return resources;
  }

  async deleteById(userId: string, planId: string): Promise<boolean> {
    const container = this.client.database(this.cfg.database).container(this.cfg.dietPlans);

    try {
      await container.item(planId, userId).delete();
      return true;
    } catch (error) {
      if (isCosmosNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }
}

class CosmosTrainingRepository implements TrainingRepository {
  constructor(private readonly client: CosmosClient, private readonly cfg: ContainerConfig) {}

  async create(plan: TrainingPlan): Promise<TrainingPlan> {
    const container = this.client.database(this.cfg.database).container(this.cfg.training);
    await container.items.upsert(plan);
    return plan;
  }

  async listByUserId(userId: string): Promise<TrainingPlan[]> {
    const container = this.client.database(this.cfg.database).container(this.cfg.training);
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query<TrainingPlan>(query).fetchAll();
    return resources;
  }

  async deleteById(userId: string, planId: string): Promise<boolean> {
    const container = this.client.database(this.cfg.database).container(this.cfg.training);

    try {
      await container.item(planId, userId).delete();
      return true;
    } catch (error) {
      if (isCosmosNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }
}

export async function tryCreateCosmosProvider(env: AppEnv): Promise<StorageProvider | null> {
  if (!env.COSMOS_ENDPOINT || !env.COSMOS_KEY) {
    return null;
  }

  const client = new CosmosClient({ endpoint: env.COSMOS_ENDPOINT, key: env.COSMOS_KEY });

  const cfg: ContainerConfig = {
    database: env.COSMOS_DATABASE,
    profiles: env.COSMOS_PROFILE_CONTAINER,
    calories: env.COSMOS_CALORIE_CONTAINER,
    diets: env.COSMOS_DIET_CONTAINER,
    dietPlans: env.COSMOS_DIET_PLAN_CONTAINER,
    training: env.COSMOS_TRAINING_CONTAINER
  };

  try {
    const { database } = await client.databases.createIfNotExists({ id: cfg.database });
    await database.containers.createIfNotExists({
      id: cfg.profiles,
      partitionKey: { paths: ["/userId"] }
    });
    await database.containers.createIfNotExists({
      id: cfg.calories,
      partitionKey: { paths: ["/userId"] }
    });
    await database.containers.createIfNotExists({
      id: cfg.diets,
      partitionKey: { paths: ["/userId"] }
    });
    await database.containers.createIfNotExists({
      id: cfg.dietPlans,
      partitionKey: { paths: ["/userId"] }
    });
    await database.containers.createIfNotExists({
      id: cfg.training,
      partitionKey: { paths: ["/userId"] }
    });
  } catch {
    return null;
  }

  return {
    mode: "cosmos",
    profile: new CosmosProfileRepository(client, cfg),
    calories: new CosmosCalorieRepository(client, cfg),
    diets: new CosmosDietRepository(client, cfg),
    dietPlans: new CosmosDietPlanRepository(client, cfg),
    training: new CosmosTrainingRepository(client, cfg)
  };
}
