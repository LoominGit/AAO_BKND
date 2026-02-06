import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import authRoutes from "../src/routes/user.routes.js";
import studentRoutes from "../src/routes/student.routes.js";
import resultRoutes from "../src/routes/result.routes.js";
import dashboardRoutes from "../src/routes/dashboard.routes.js";
import dbConnection from "../src/config/db.js";
import seedAdminUser from "../src/scripts/seedAdmin.js";

dotenv.config();

const app = express();

// Database connection promise with caching
let dbConnected = false;
let dbPromise = null;

const initializeApp = async () => {
  if (!dbConnected) {
    if (!dbPromise) {
      dbPromise = (async () => {
        try {
          console.log("🔄 Initializing database connection...");
          await dbConnection();
          console.log("🔄 Seeding admin user...");
          await seedAdminUser();
          dbConnected = true;
          console.log("✅ Database and admin initialized");
        } catch (error) {
          console.error("❌ Initialization error:", error);
          dbPromise = null; // Reset promise on error
          throw error;
        }
      })();
    }
    await dbPromise;
  }
};

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

// Initialize database before handling any request
app.use(async (req, res, next) => {
  try {
    await initializeApp();
    next();
  } catch (error) {
    console.error("Database initialization failed:", error);
    res.status(500).json({
      error: "Database initialization failed",
      message: error.message,
    });
  }
});

// Routes
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Server running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Export for Vercel serverless
export default app;
