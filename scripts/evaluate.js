import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import SystemState from "../models/SystemState.js";
import { masterAnswers } from "../data/clues.js";

dotenv.config();

const evaluate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Evaluating Sherlocked submissions...\n");

    const users = await User.find({});
    let results = [];

    for (let user of users) {
      let score = 0;
      let latestCorrectTime = 0;

      if (user.submissions && user.submissions.length > 0) {
        for (let sub of user.submissions) {
          const expected = masterAnswers[sub.questionId];
          if (!expected) continue;

          if (sub.answer.toLowerCase().trim() === expected.toLowerCase()) {
            score++;
            if (sub.submittedAt > latestCorrectTime) {
              latestCorrectTime = sub.submittedAt;
            }
          }
        }
      }

      results.push({
        name: user.name,
        scoreValue: score,
        scoreStr: `${score}/3`,
        timeValue: latestCorrectTime,
        timeStr: latestCorrectTime
          ? new Date(latestCorrectTime).toLocaleTimeString()
          : "N/A",
      });
    }

    // Sort: Highest score first. If tied, lowest (earliest) time wins.
    results.sort((a, b) => {
      if (b.scoreValue !== a.scoreValue) return b.scoreValue - a.scoreValue;
      return a.timeValue - b.timeValue;
    });

    // Assign ranks
    const leaderboard = results.map((res, index) => ({
      rank: index + 1,
      name: res.name,
      score: res.scoreStr,
      time: res.timeStr,
    }));

    // Save to database and lock the game
    await SystemState.findOneAndUpdate(
      { singletonId: "sherlocked_state" },
      { isGameOver: true, leaderboard: leaderboard },
      { upsert: true, returnDocument: "after" }, // <--- Fixed
    );

    console.log("Evaluation complete. Game locked. Leaderboard saved to DB.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

evaluate();
