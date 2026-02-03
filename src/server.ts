import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import resultRoutes from "./routes/result.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Ensure this matches your frontend exactly
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Server running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- VERCEL HANDLER WRAPPER ---
// This prevents the connection from closing or duplicating
export default async function handler(req: Request, res: Response) {
  try {
    await connectDB(); // Ensure DB is connected before processing
  } catch (e) {
    console.error("Database connection failed", e);
    return res.status(500).json({ error: "Database connection failed" });
  }

  // Handle CORS Preflight Manually for Vercel
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Pass the request to Express
  app(req, res);
}
