import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { calculateDailyCalories } from "../domain/calorie.js";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const inputSchema = z.object({
  currentWeightKg: z.number().positive(),
  targetWeightKg: z.number().positive(),
  monthsToGoal: z.number().int().min(1).max(36),
  activityLevel: z.enum(["low", "medium", "high"])
});

export function createCalorieRoutes(storage: StorageProvider): Router {
  const router = Router();

  router.post("/calculate", async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = inputSchema.parse(req.body);
      const result = calculateDailyCalories(input);
      const session = {
        id: randomUUID(),
        userId: req.userId!,
        createdAt: new Date().toISOString(),
        input,
        result
      };

      await storage.calories.create(session);
      res.status(201).json({ session });
    } catch (error) {
      next(error);
    }
  });

  router.get("/history", async (req: AuthenticatedRequest, res, next) => {
    try {
      const sessions = await storage.calories.listByUserId(req.userId!);
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
