import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "viewer"],
      default: "student",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", UserSchema);
