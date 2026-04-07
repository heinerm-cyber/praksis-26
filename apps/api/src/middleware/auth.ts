import type { Request, Response, NextFunction } from "express";

export type AuthenticatedRequest = Request & {
  userId?: string;
};

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const userId = req.header("x-user-id");

  if (!userId) {
    res.status(401).json({ error: "Mangler bruker-kontekst" });
    return;
  }

  req.userId = userId;
  next();
}
