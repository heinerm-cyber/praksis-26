import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AuthTokenPayload } from "../auth/token.js";

export type AuthenticatedRequest = Request & {
  userId?: string;
  user?: AuthTokenPayload;
};

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "Mangler tilgangstoken" });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({ error: "Mangler tilgangstoken" });
    return;
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    req.userId = user.sub;
    next();
  } catch {
    res.status(401).json({ error: "Ugyldig eller utlopet tilgangstoken" });
  }
}
