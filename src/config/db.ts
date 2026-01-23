import mongoose from "mongoose";
// Configure dotenv to load environment variables from a .env file

import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.DB_CNN || "";

const dbConnection = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("DB Online");
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("An unknown error occurred");
    }
    process.exit(1);
  }
};

export default dbConnection;
