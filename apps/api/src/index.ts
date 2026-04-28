import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireUser } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createAuthRoutes } from "./routes/authRoutes.js";
import { createCalorieRoutes } from "./routes/calorieRoutes.js";
import { createDietRoutes } from "./routes/dietRoutes.js";
import { createProfileRoutes } from "./routes/profileRoutes.js";
import { createTrainingRoutes } from "./routes/trainingRoutes.js";
import { createStorageProvider } from "./storage/createStorageProvider.js";

const defaultCorsOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

function resolveAllowedCorsOrigins(): string[] {
  const configured = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [];

  return configured.length > 0 ? configured : defaultCorsOrigins;
}

async function bootstrap(): Promise<void> {
  const app = express();
  const storage = await createStorageProvider();
  const allowedOrigins = resolveAllowedCorsOrigins();

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      storageMode: storage.mode,
      fallbackActive: storage.mode === "memory"
    });
  });

  app.use("/api/auth", createAuthRoutes());
  app.use("/api/profile", requireUser, createProfileRoutes(storage));
  app.use("/api/calories", requireUser, createCalorieRoutes(storage));
  app.use("/api/diets", requireUser, createDietRoutes(storage));
  app.use("/api/training", requireUser, createTrainingRoutes(storage));

  app.use(errorHandler);

  const port = Number(env.PORT);
  app.listen(port, () => {
    console.log(
      `pump-api listening on port ${port} using ${storage.mode} storage with CORS origins: ${allowedOrigins.join(", ")}`
    );
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
