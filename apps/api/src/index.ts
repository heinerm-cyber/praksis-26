import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireUser } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createCalorieRoutes } from "./routes/calorieRoutes.js";
import { createDietRoutes } from "./routes/dietRoutes.js";
import { createProfileRoutes } from "./routes/profileRoutes.js";
import { createTrainingRoutes } from "./routes/trainingRoutes.js";
import { createStorageProvider } from "./storage/createStorageProvider.js";

async function bootstrap(): Promise<void> {
  const app = express();
  const storage = await createStorageProvider();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      storageMode: storage.mode,
      fallbackActive: storage.mode === "memory"
    });
  });

  app.use("/api/profile", requireUser, createProfileRoutes(storage));
  app.use("/api/calories", requireUser, createCalorieRoutes(storage));
  app.use("/api/diets", requireUser, createDietRoutes(storage));
  app.use("/api/training", requireUser, createTrainingRoutes(storage));

  app.use(errorHandler);

  const port = Number(env.PORT);
  app.listen(port, () => {
    console.log(`pump-api listening on port ${port} using ${storage.mode} storage`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
