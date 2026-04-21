import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
};

const googleClient = new OAuth2Client();

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google-innlogging er ikke konfigurert i API");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.name || !payload.email_verified) {
    throw new Error("Google-token mangler nødvendig brukerinfo");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name
  };
}