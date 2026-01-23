// src/server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import serverless from "serverless-http";

import { seedAdminUser } from "./scripts/seedAdmin.js";
import authRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import resultRoutes from "./routes/result.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import connectDB from "./config/db.js";

// Load local .env for local dev. In Vercel, configure env vars in the dashboard.
if (process.env.NODE_ENV !== "production") dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// health
app.get("/", (_: Request, res: Response) => {
  res.status(200).json({ message: "Server is running", success: true });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

/**
 * Serverless / DB wiring:
 * - connectDB() is called once per cold start and cached
 * - optionally run seeder only when RUN_SEED=true (set in Vercel UI if needed)
 */
let dbReady: Promise<void> | null = null;
async function ensureDbReady() {
  if (!dbReady) {
    dbReady = (async () => {
      await connectDB(); // your existing function should return when connected
      // Only run seeder if explicitly requested (avoid running on every invocation)
      if (process.env.RUN_SEED === "true") {
        try {
          await seedAdminUser();
          console.log("Seeder run complete");
        } catch (err) {
          console.error("Seeder failed:", err);
        }
      }
    })();
  }
  return dbReady;
}

// Wrap express app as a serverless handler, but delay handling until DB is ready
const expressHandler = serverless(app);

export default async function handler(req: any, res: any) {
  try {
    await ensureDbReady();
    return expressHandler(req, res);
  } catch (err) {
    console.error("Handler error:", err);
    res.statusCode = 500;
    return res.end("Internal Server Error");
  }
}
