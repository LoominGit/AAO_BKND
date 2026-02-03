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
    throw error;
  }
};

// Create Express app
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
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// Vercel Serverless Function Handler
export default async function handler(req: Request, res: Response) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || "*",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie",
    );
    res.status(200).end();
    return;
  }

  try {
    // Connect to database
    await connectDatabase();

    // Pass request to Express app
    return new Promise<void>((resolve, reject) => {
      app(req, res);

      res.on("finish", () => resolve());
      res.on("error", (err) => reject(err));
    });
  } catch (error) {
    console.error("Critical Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
