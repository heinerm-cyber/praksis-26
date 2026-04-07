import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  COSMOS_ENDPOINT: z.string().optional(),
  COSMOS_KEY: z.string().optional(),
  COSMOS_DATABASE: z.string().default("pump"),
  COSMOS_PROFILE_CONTAINER: z.string().default("profiles"),
  COSMOS_CALORIE_CONTAINER: z.string().default("calories"),
  COSMOS_DIET_CONTAINER: z.string().default("diets"),
  COSMOS_TRAINING_CONTAINER: z.string().default("trainingPlans")
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
