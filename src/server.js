import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import resultRoutes from "./routes/result.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();
const app = express();

// Importing the Database Connection
import dbConnection from "./config/db.js";
dbConnection();

// seed admin user
import seedAdminUser from "./scripts/seedAdmin.js";
seedAdminUser();

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
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Server running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
