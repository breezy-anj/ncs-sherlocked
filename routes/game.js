import express from "express";
import authenticate from "../middleware/authenticate.js";
import { clues } from "../data/clues.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/clues", authenticate, (req, res) => {
  res.status(200).json({ success: true, clues });
});

router.post("/submit", authenticate, async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Missing questionId or answer" });
    }

    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const existingIndex = user.submissions.findIndex(
      (sub) => sub.questionId === questionId,
    );

    if (existingIndex >= 0) {
      user.submissions[existingIndex].answer = answer;
      user.submissions[existingIndex].submittedAt = Date.now();
    } else {
      user.submissions.push({ questionId, answer, submittedAt: Date.now() });
    }

    await user.save();
    res
      .status(200)
      .json({
        success: true,
        message: `Answer for Question ${questionId} locked in.`,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
