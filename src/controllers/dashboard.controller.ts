import { Request, Response } from "express";
import Student from "../model/student.model.js";
import Result from "../model/result.model.js";

export const getDashboardStats = async (_: Request, res: Response) => {
  try {
    // 1. Basic Counts
    const totalStudents = await Student.countDocuments();
    const distinctSchools = await Student.distinct("school");

    // 2. Performance Stats (Aggregation)
    const performanceStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgTotal: { $avg: "$percentage" }, // Overall Average
          // Subject-wise Averages
          avgMath: { $avg: "$sectionScores.math" },
          avgScience: { $avg: "$sectionScores.science" },
          avgEnglish: { $avg: "$sectionScores.english" },
          avgGk: { $avg: "$sectionScores.gk" },
          // Max Scores (for the Chart)
          maxMath: { $max: "$sectionScores.math" },
          maxScience: { $max: "$sectionScores.science" },
          maxEnglish: { $max: "$sectionScores.english" },
          maxGk: { $max: "$sectionScores.gk" },
        },
      },
    ]);

    const stats = performanceStats[0] || { avgTotal: 0 };

    // 3. Top Performers (for the list)
    const topPerformers = await Result.find()
      .sort({ totalMarks: -1 })
      .limit(5)
      .populate("student", "name school section");

    res.json({
      counts: {
        students: totalStudents,
        schools: distinctSchools.length,
        reports: await Result.countDocuments(), // Assuming 1 result = 1 report generated
        avgScore: Math.round(stats.avgTotal || 0),
      },
      chartData: [
        {
          subject: "Math",
          average: Math.round(stats.avgMath),
          top: stats.maxMath,
        },
        {
          subject: "Science",
          average: Math.round(stats.avgScience),
          top: stats.maxScience,
        },
        {
          subject: "English",
          average: Math.round(stats.avgEnglish),
          top: stats.maxEnglish,
        },
        { subject: "GK", average: Math.round(stats.avgGk), top: stats.maxGk },
      ],
      topPerformers,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
