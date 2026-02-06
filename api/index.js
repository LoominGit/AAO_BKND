import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDB: !!process.env.DB_CNN,
    },
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const dbModule = await import("../src/config/db.js");
    await dbModule.default();
    res.json({ message: "Database connected successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      stack: error.stack,
    });
  }
});

export default app;
