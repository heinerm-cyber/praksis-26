import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

type SignedTokenPayload = AuthTokenPayload & {
  iat?: number;
  exp?: number;
};

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 12;

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.AUTH_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: TOKEN_EXPIRY_SECONDS
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.AUTH_TOKEN_SECRET, {
    algorithms: ["HS256"]
  }) as SignedTokenPayload;

  return {
    sub: decoded.sub,
    email: decoded.email,
    name: decoded.name
  };
}
