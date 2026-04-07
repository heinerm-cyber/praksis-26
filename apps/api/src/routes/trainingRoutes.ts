import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { suggestTrainingByCalories } from "../domain/calorie.js";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const createPlanSchema = z.object({
  planName: z.string().min(2),
  trainingTypes: z.array(z.string().min(2)).min(1),
  weeklySessions: z.number().int().min(1).max(14)
});

const suggestionQuery = z.object({
  dailyCalories: z.coerce.number().int().positive()
});

export function createTrainingRoutes(storage: StorageProvider): Router {
  const router = Router();

  router.post("/plans", async (req: AuthenticatedRequest, res, next) => {
    try {
      const data = createPlanSchema.parse(req.body);
      const plan = {
        id: randomUUID(),
        userId: req.userId!,
        createdAt: new Date().toISOString(),
        ...data,
        suggestedByCalories: false
      };

      await storage.training.create(plan);
      res.status(201).json({ plan });
    } catch (error) {
      next(error);
    }
  });

  router.get("/plans", async (req: AuthenticatedRequest, res, next) => {
    try {
      const plans = await storage.training.listByUserId(req.userId!);
      res.json({ plans });
    } catch (error) {
      next(error);
    }
  });

  router.get("/suggestions", (req: AuthenticatedRequest, res, next) => {
    try {
      const { dailyCalories } = suggestionQuery.parse(req.query);
      const suggestions = suggestTrainingByCalories(dailyCalories);
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
