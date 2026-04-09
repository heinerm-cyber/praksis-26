import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

type LocalAuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  pumpLocalUsers?: Map<string, LocalAuthUser>;
};

const users = globalStore.pumpLocalUsers ?? new Map<string, LocalAuthUser>();

if (!globalStore.pumpLocalUsers) {
  globalStore.pumpLocalUsers = users;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function makePasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHashHex] = passwordHash.split(":");
  if (!salt || !storedHashHex) {
    return false;
  }

  const computedHash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(storedHashHex, "hex");

  if (storedHash.length !== computedHash.length) {
    return false;
  }

  return timingSafeEqual(storedHash, computedHash);
}

export function registerLocalUser(input: {
  name: string;
  email: string;
  password: string;
}): LocalAuthUser {
  const email = normalizeEmail(input.email);
  if (users.has(email)) {
    throw new Error("E-post er allerede registrert");
  }

  const user: LocalAuthUser = {
    id: `local-${randomBytes(8).toString("hex")}`,
    name: input.name.trim(),
    email,
    passwordHash: makePasswordHash(input.password),
    createdAt: new Date().toISOString()
  };

  users.set(email, user);
  return user;
}

export function authenticateLocalUser(input: {
  email: string;
  password: string;
}): LocalAuthUser | null {
  const user = users.get(normalizeEmail(input.email));
  if (!user) {
    return null;
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    return null;
  }

  return user;
}

export function findLocalUserByEmail(email: string): LocalAuthUser | null {
  return users.get(normalizeEmail(email)) ?? null;
}