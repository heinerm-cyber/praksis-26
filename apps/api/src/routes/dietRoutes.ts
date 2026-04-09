import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { suggestDiet } from "../domain/calorie.js";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const querySchema = z.object({
  dailyCalories: z.coerce.number().int().positive()
});

export function createDietRoutes(storage: StorageProvider): Router {
  const router = Router();

  router.get("/suggestions", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { dailyCalories } = querySchema.parse(req.query);
      const suggestionData = suggestDiet(dailyCalories);
      const suggestion = {
        id: randomUUID(),
        userId: req.userId!,
        createdAt: new Date().toISOString(),
        dailyCalories,
        ...suggestionData
      };

      await storage.diets.create(suggestion);
      res.json({ suggestion });
    } catch (error) {
      next(error);
    }
  });

  router.get("/history", async (req: AuthenticatedRequest, res, next) => {
    try {
      const suggestions = await storage.diets.listByUserId(req.userId!);
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
