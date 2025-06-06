// config/connectDB.js
import mongoose from "mongoose";
import "dotenv/config";
import logger from "../utils/logger.js";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.Mongo_URL, {
      dbName: "Food-Ordering-System",
    });
    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
