import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import SystemState from "../models/SystemState.js";

// NOTE: from dev: DO NOT RUN THIS SCRIPT UNLESS YOU WANT TO DELETE ALL ENTRIES FROM THE DATABASE
dotenv.config();

const resetSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany({});

    await SystemState.findOneAndUpdate(
      { singletonId: "sherlocked_state" },
      { isGameStarted: false, isGameOver: false, leaderboard: [] },
      { upsert: true, returnDocument: "after" },
    );

    console.log("\n[WARNING] DATABASE PURGED.");
    console.log(
      "[SUCCESS] All detectives deleted. System state reset. Ready for a fresh start.\n",
    );
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetSystem();
