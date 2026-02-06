import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.DB_CNN || process.env.MONGO_URI || "";

// Track connection state for serverless
let isConnected = false;

const dbConnection = async () => {
  // If already connected, reuse the connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("📦 Using existing database connection");
    return;
  }

  try {
    if (!MONGO_URI) {
      throw new Error(
        "DB_CNN or MONGO_URI is not defined in environment variables",
      );
    }

    // Mongoose connection options optimized for serverless
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, options);

    isConnected = true;
    console.log("✅ DB Online");

    // Handle connection events
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log("🔗 MongoDB connected");
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      isConnected = false;
      console.error("❌ MongoDB connection error:", err);
    });
  } catch (error) {
    isConnected = false;
    if (error instanceof Error) {
      console.error("❌ DB Connection Error:", error.message);
    } else {
      console.error("❌ An unknown error occurred");
    }
    throw error; // Don't exit process in serverless
  }
};

export default dbConnection;
