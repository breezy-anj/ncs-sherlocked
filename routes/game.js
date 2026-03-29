import express from "express";
import authenticate from "../middleware/authenticate.js";
import { clues } from "../data/clues.js";
import User from "../models/User.js";
import SystemState from "../models/SystemState.js";

const router = express.Router();

const getSystemState = async () => {
  let state = await SystemState.findOne({ singletonId: "sherlocked_state" });
  if (!state) {
    state = await SystemState.create({
      isGameStarted: false,
      isGameOver: false,
      leaderboard: [],
    });
  }
  return state;
};

// 1. GET /clues - Now hides clues if the game hasn't started
router.get("/clues", authenticate, async (req, res) => {
  try {
    const state = await getSystemState();

    // If the game hasn't started, withhold the clues
    if (!state.isGameStarted) {
      return res
        .status(200)
        .json({ success: true, isGameStarted: false, clues: [] });
    }

    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      isGameStarted: true,
      clues,
      submissions: user ? user.submissions : [],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// 2. POST /submit - Block early birds and latecomers
router.post("/submit", authenticate, async (req, res) => {
  try {
    const state = await getSystemState();

    if (!state.isGameStarted) {
      return res
        .status(403)
        .json({ success: false, message: "The case hasn't opened yet." });
    }
    if (state.isGameOver) {
      return res
        .status(403)
        .json({
          success: false,
          message: "The case is closed. Submissions are locked.",
        });
    }

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

router.get("/leaderboard", async (req, res) => {
  try {
    const state = await getSystemState();
    res.status(200).json({
      success: true,
      isGameOver: state.isGameOver,
      leaderboard: state.leaderboard,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
