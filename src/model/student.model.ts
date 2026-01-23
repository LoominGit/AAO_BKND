import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  rollNumber: string;
  name: string;
  class: string;
  section: string;
  school: string;
  district: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    rollNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    school: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Compound index for filtering (e.g., Get all Class 10 students in DPS)
StudentSchema.index({ school: 1, class: 1 });

export default mongoose.model<IStudent>("Student", StudentSchema);
