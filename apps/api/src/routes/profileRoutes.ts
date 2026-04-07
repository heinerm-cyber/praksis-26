import { Router } from "express";
import { z } from "zod";
import type { StorageProvider } from "../storage/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

export function createProfileRoutes(storage: StorageProvider): Router {
  const router = Router();

  router.get("/me", async (req: AuthenticatedRequest, res, next) => {
    try {
      const profile = await storage.profile.getByUserId(req.userId!);
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.post("/me", async (req: AuthenticatedRequest, res, next) => {
    try {
      const data = profileSchema.parse(req.body);
      const now = new Date().toISOString();

      const profile = await storage.profile.upsert({
        id: req.userId!,
        userId: req.userId!,
        createdAt: now,
        ...data
      });

      res.status(201).json({ profile });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
