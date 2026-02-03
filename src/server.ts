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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit to prevent memory crashes
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Explicit methods help avoid preflight issues
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

// Database Connection Cache
let cachedConnection: any = null;

const connectDatabase = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    cachedConnection = await connectDB();
    console.log("✅ MongoDB Connected");
    return cachedConnection;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    // Do not throw here; let the handler catch it so we can return a 500 response
    throw error;
  }
};

// Vercel Entry Point
export default async function handler(req: Request, res: Response) {
  // 1. Handle Preflight (OPTIONS)
  // This is critical for CORS to work on Vercel
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // 2. Await DB Connection
    await connectDatabase();

    // 3. Pass request to Express
    // DO NOT await this or wrap in a Promise.
    // Express handles the response stream directly.
    app(req, res);
  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
