import mongoose from "mongoose";
import "dotenv/config";

const connectDb = async (req, res) => {
  try {
    await mongoose.connect(process.env.Mongo_URL, {
      dbName: "Food-Ordering-System",
    });
    console.log("MongoDb connected...!");
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

export default connectDb;