import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { suggestDiet } from "../domain/calorie.js";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const querySchema = z.object({
  dailyCalories: z.coerce.number().int().positive()
});

const manualDietPlanSchema = z.object({
  sourceType: z.literal("manual"),
  planName: z.string().min(2).max(80),
  meals: z.array(z.string().min(2).max(120)).min(1).max(12),
  dailyCalories: z.number().int().positive().optional(),
  notes: z.string().max(500).optional()
});

const suggestionDietPlanSchema = z.object({
  sourceType: z.literal("from-suggestion"),
  dailyCalories: z.number().int().positive(),
  planName: z.string().min(2).max(80).optional(),
  notes: z.string().max(500).optional()
});

const dietPlanSchema = z.union([manualDietPlanSchema, suggestionDietPlanSchema]);

const planParamsSchema = z.object({
  planId: z.string().uuid()
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

  router.post("/plans", async (req: AuthenticatedRequest, res, next) => {
    try {
      const payload = dietPlanSchema.parse(req.body);

      if (payload.sourceType === "from-suggestion") {
        const suggestionData = suggestDiet(payload.dailyCalories);
        const plan = {
          id: randomUUID(),
          userId: req.userId!,
          createdAt: new Date().toISOString(),
          sourceType: payload.sourceType,
          dailyCalories: payload.dailyCalories,
          planName: payload.planName ?? suggestionData.dietName,
          dietName: suggestionData.dietName,
          meals: suggestionData.meals,
          notes: payload.notes
        };

        await storage.dietPlans.create(plan);
        res.status(201).json({ plan });
        return;
      }

      const plan = {
        id: randomUUID(),
        userId: req.userId!,
        createdAt: new Date().toISOString(),
        sourceType: payload.sourceType,
        planName: payload.planName,
        meals: payload.meals,
        dailyCalories: payload.dailyCalories,
        notes: payload.notes
      };

      await storage.dietPlans.create(plan);
      res.status(201).json({ plan });
    } catch (error) {
      next(error);
    }
  });

  router.get("/plans", async (req: AuthenticatedRequest, res, next) => {
    try {
      const plans = await storage.dietPlans.listByUserId(req.userId!);
      res.json({ plans });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/plans/:planId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { planId } = planParamsSchema.parse(req.params);
      const deleted = await storage.dietPlans.deleteById(req.userId!, planId);

      if (!deleted) {
        res.status(404).json({ error: "Fant ikke kostholdplan" });
        return;
      }

      res.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
