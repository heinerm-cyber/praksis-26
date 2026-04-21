import { Router } from "express";
import { z } from "zod";
import { verifyGoogleIdToken } from "../auth/googleToken.js";
import { loginLocalUser, registerLocalUser } from "../auth/localAuthStore.js";
import { signAccessToken } from "../auth/token.js";
import { requireUser } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email("Skriv inn en gyldig e-post"),
  name: z.string().trim().min(2, "Navn må være minst 2 tegn"),
  password: z.string().min(6, "Passord må være minst 6 tegn")
});

const loginSchema = z.object({
  email: z.string().email("Skriv inn en gyldig e-post"),
  password: z.string().min(1, "Fyll inn både e-post og passord")
});

const googleSchema = z.object({
  idToken: z.string().min(10, "Google-token mangler")
});

export function createAuthRoutes(): Router {
  const router = Router();

  router.post("/register", (req, res, next) => {
    try {
      const payload = registerSchema.parse(req.body);
      const user = registerLocalUser(payload);
      const accessToken = signAccessToken({
        sub: user.userId,
        email: user.email,
        name: user.name
      });

      res.status(201).json({
        session: {
          accessToken,
          userId: user.userId,
          email: user.email,
          name: user.name,
          provider: "local",
          loggedInAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", (req, res, next) => {
    try {
      const payload = loginSchema.parse(req.body);
      const user = loginLocalUser(payload);
      const accessToken = signAccessToken({
        sub: user.userId,
        email: user.email,
        name: user.name
      });

      res.json({
        session: {
          accessToken,
          userId: user.userId,
          email: user.email,
          name: user.name,
          provider: "local",
          loggedInAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/google", async (req, res, next) => {
    try {
      const payload = googleSchema.parse(req.body);
      const googleUser = await verifyGoogleIdToken(payload.idToken);
      const userId = `google:${googleUser.sub}`;
      const accessToken = signAccessToken({
        sub: userId,
        email: googleUser.email,
        name: googleUser.name
      });

      res.json({
        session: {
          accessToken,
          userId,
          email: googleUser.email,
          name: googleUser.name,
          provider: "google",
          loggedInAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", requireUser, (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Ikke autentisert" });
      return;
    }

    res.json({
      user: {
        userId: req.user.sub,
        email: req.user.email,
        name: req.user.name
      }
    });
  });

  return router;
}
