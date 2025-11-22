import mongoose from "mongoose";

const RefreshTOkenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresIn: {
    type: Date,
    required: true,
  },
  timestamps: true,
}); // mongoose.model("RefreshToken", RefreshTOkenSchema);

export default mongoose.model("RefreshToken", RefreshTOkenSchema);