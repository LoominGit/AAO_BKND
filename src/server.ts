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

// Load env locally
dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // Vercel only allows writing to /tmp
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Change this to your frontend URL in production
    credentials: true,
  }),
);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Server running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ✅ Connect DB ONCE per cold start
let isConnected = false;

const connectDatabase = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB ready");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw error; // Rethrow to ensure Vercel catches the startup error
    }
  }
};

// Vercel Handler
export default async function handler(req: Request, res: Response) {
  // 1. Handle CORS preflight requests immediately
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // 2. Ensure DB is connected
    await connectDatabase();

    // 3. Pass request to Express
    // app is a function (req, res) => void
    app(req, res);
  } catch (error) {
    console.error("Critical Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
