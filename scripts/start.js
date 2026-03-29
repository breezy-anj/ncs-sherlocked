import mongoose from "mongoose";
import dotenv from "dotenv";
import SystemState from "../models/SystemState.js";

dotenv.config();

const startGame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await SystemState.findOneAndUpdate(
      { singletonId: "sherlocked_state" },
      { isGameStarted: true, isGameOver: false, leaderboard: [] },
      { upsert: true, returnDocument: "after" },
    );

    console.log(
      "\n[SUCCESS] Event Started! The Case Files are now live and visible to detectives.\n",
    );
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startGame();
