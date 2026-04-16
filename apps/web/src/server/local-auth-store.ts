import { randomUUID } from "crypto";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __pumpLocalAuthUsers: Map<string, StoredUser> | undefined;
}

const byEmail = globalThis.__pumpLocalAuthUsers ?? new Map<string, StoredUser>();
globalThis.__pumpLocalAuthUsers = byEmail;

export type PublicUser = {
  userId: string;
  email: string;
  name: string;
};

export function registerLocalUser(input: {
  email: string;
  name: string;
  password: string;
}): PublicUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (byEmail.has(normalizedEmail)) {
    throw new Error("E-posten er allerede registrert");
  }

  const user: StoredUser = {
    id: randomUUID(),
    email: normalizedEmail,
    name: input.name.trim(),
    password: input.password,
    createdAt: new Date().toISOString()
  };

  byEmail.set(normalizedEmail, user);

  return {
    userId: user.id,
    email: user.email,
    name: user.name
  };
}

export function loginLocalUser(input: { email: string; password: string }): PublicUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = byEmail.get(normalizedEmail);

  if (!user || user.password !== input.password) {
    throw new Error("Ugyldig e-post eller passord");
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name
  };
}
