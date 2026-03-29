import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    answer: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zealId: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  admissionNumber: { type: String, required: true },
  password: { type: String, required: true },
  firstLogin: { type: Date },
  submissions: [SubmissionSchema],
});

export default mongoose.model("User", UserSchema);
