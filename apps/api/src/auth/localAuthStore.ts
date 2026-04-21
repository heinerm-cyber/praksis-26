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
  var __pumpApiLocalAuthUsers: Map<string, StoredUser> | undefined;
}

const usersByEmail = globalThis.__pumpApiLocalAuthUsers ?? new Map<string, StoredUser>();
globalThis.__pumpApiLocalAuthUsers = usersByEmail;

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

  if (usersByEmail.has(normalizedEmail)) {
    throw new Error("E-posten er allerede registrert");
  }

  const stored: StoredUser = {
    id: randomUUID(),
    email: normalizedEmail,
    name: input.name.trim(),
    password: input.password,
    createdAt: new Date().toISOString()
  };

  usersByEmail.set(normalizedEmail, stored);

  return {
    userId: stored.id,
    email: stored.email,
    name: stored.name
  };
}

export function loginLocalUser(input: { email: string; password: string }): PublicUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  const stored = usersByEmail.get(normalizedEmail);

  if (!stored || stored.password !== input.password) {
    throw new Error("Ugyldig e-post eller passord");
  }

  return {
    userId: stored.id,
    email: stored.email,
    name: stored.name
  };
}
