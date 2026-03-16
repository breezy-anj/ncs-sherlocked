import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { masterAnswers } from "../data/clues.js";

dotenv.config();

const evaluate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Evaluating Sherlocked submissions...\n");

    const users = await User.find({});

    for (let user of users) {
      let score = 0;
      let latestCorrectTime = 0; // To track who finished first

      if (!user.submissions || user.submissions.length === 0) {
        console.log(
          `Player: ${user.name} | Score: 0/3 | Status: NO SUBMISSIONS`,
        );
        continue;
      }

      for (let sub of user.submissions) {
        const expected = masterAnswers[sub.questionId];
        if (!expected) continue;

        if (sub.answer.toLowerCase().trim() === expected.toLowerCase()) {
          score++;

          // compares time for tie braking
          if (sub.submittedAt > latestCorrectTime) {
            latestCorrectTime = sub.submittedAt;
          }
        }
      }

      const timeString = latestCorrectTime
        ? new Date(latestCorrectTime).toLocaleString()
        : "N/A";
      console.log(
        `Player: ${user.name} | Score: ${score}/3 | Last Correct: ${timeString}`,
      );
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

evaluate();
