import mongoose, { Schema } from "mongoose";

const ResultSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    examId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true },

    // Storing Map allows flexible section names per subject
    sectionScores: {
      type: Map,
      of: Number,
      required: true,
    },

    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

// Ensure a student has only ONE result per subject per exam
ResultSchema.index({ student: 1, examId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model("Result", ResultSchema);
