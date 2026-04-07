import { env } from "../config/env.js";
import { createMemoryProvider } from "./memoryProvider.js";
import { tryCreateCosmosProvider } from "./cosmosProvider.js";
import type { StorageProvider } from "./types.js";

export async function createStorageProvider(): Promise<StorageProvider> {
  const cosmosProvider = await tryCreateCosmosProvider(env);
  if (cosmosProvider) {
    return cosmosProvider;
  }

  return createMemoryProvider();
}
