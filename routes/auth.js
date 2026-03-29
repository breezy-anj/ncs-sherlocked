import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

const getSystemState = async () => {
  const SystemState = await import("../models/SystemState.js").then(
    (m) => m.default,
  );
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

router.post("/register", async (req, res) => {
  try {
    const { name, zealId, year, admissionNumber, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      zealId,
      year,
      admissionNumber,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, zealId: user.zealId },
      process.env.JWT_SECRET,
    );

    const state = await getSystemState();

    res.status(201).json({
      success: true,
      message: "Detective registered.",
      token,
      user: { name: user.name, zealId: user.zealId },
      isGameOver: state.isGameOver,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { zealId, password } = req.body;
    const user = await User.findOne({ zealId });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Detective not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });

    if (!user.firstLogin) {
      user.firstLogin = Date.now();
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, zealId: user.zealId },
      process.env.JWT_SECRET,
    );

    const state = await getSystemState();

    res.status(200).json({
      success: true,
      token,
      user: { name: user.name, zealId: user.zealId },
      isGameOver: state.isGameOver,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
