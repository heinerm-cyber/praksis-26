import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { suggestTrainingByCalories } from "../domain/calorie.js";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const weekDays = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag"
] as const;

const weekDayEnum = z.enum(weekDays);

function normalizeWeekDay(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const normalized = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const map: Record<string, string> = {
    mandag: "Mandag",
    tirsdag: "Tirsdag",
    onsdag: "Onsdag",
    torsdag: "Torsdag",
    fredag: "Fredag",
    lordag: "Lørdag",
    sondag: "Søndag"
  };

  return map[normalized] ?? input;
}

const weekDaySchema = z
  .string()
  .min(2)
  .transform((value) => normalizeWeekDay(value))
  .pipe(weekDayEnum);

const dayPlanSchema = z.object({
  day: weekDaySchema,
  exercises: z.array(z.string().min(2)).max(20),
  notes: z.string().max(240).optional()
});

const createPlanSchema = z.object({
  planName: z.string().min(2),
  trainingTypes: z.array(z.string().min(2)).min(1),
  weeklySessions: z.number().int().min(1).max(14),
  weekPlan: z
    .array(dayPlanSchema)
    .length(7)
    .refine(
      (days) => new Set(days.map((item) => item.day)).size === weekDays.length,
      "Ukeplan må inneholde hver ukedag nøyaktig én gang"
    )
});

const suggestionQuery = z.object({
  dailyCalories: z.coerce.number().int().positive()
});

const planParamsSchema = z.object({
  planId: z.string().uuid()
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

  router.delete("/plans/:planId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { planId } = planParamsSchema.parse(req.params);
      const deleted = await storage.training.deleteById(req.userId!, planId);

      if (!deleted) {
        res.status(404).json({ error: "Fant ikke treningsplan" });
        return;
      }

      res.json({ deleted: true });
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
