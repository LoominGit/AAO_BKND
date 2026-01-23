import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import serverless from "serverless-http";

import authRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import resultRoutes from "./routes/result.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import connectDB from "./config/db.js";

// Load env locally
dotenv.config();

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
    origin: "*",
    credentials: true,
  }),
);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Server running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ✅ Connect DB ONCE per cold start
let dbConnected = false;

async function initDB() {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
    console.log("✅ MongoDB ready");
  }
}

// Wrap handler
const handler = serverless(app);

export default async function main(req: any, res: any) {
  try {
    await initDB();
    return handler(req, res);
  } catch (err) {
    console.error("❌ Serverless crash:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
