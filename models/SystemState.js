import mongoose from "mongoose";

const SystemStateSchema = new mongoose.Schema({
  singletonId: { type: String, default: "sherlocked_state", unique: true },
  isGameStarted: { type: Boolean, default: false },
  isGameOver: { type: Boolean, default: false },
  leaderboard: [
    {
      rank: Number,
      name: String,
      year: Number,
      admissionNumber: String,
      score: String,
      time: String,
    },
  ],
});

export default mongoose.model("SystemState", SystemStateSchema);
