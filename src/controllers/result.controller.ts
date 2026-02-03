import { Request, Response } from "express";
import Result from "../model/result.model.js";
import Student from "../model/student.model.js";

// @desc    Get Leaderboard / Rankings
// @route   GET /api/results/rankings?level=school&entity=DPS
export const getRankings = async (req: Request, res: Response) => {
  try {
    const { level, entity, limit = 50 } = req.query; // level: 'school' | 'district' | 'national'

    const pipeline: any[] = [
      // 1. Join with Students to get names/schools
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
    ];

    // 2. Filter based on Request (e.g. only show students from "Delhi Public School")
    if (level === "school" && entity) {
      pipeline.push({ $match: { "studentDetails.school": entity } });
    } else if (level === "district" && entity) {
      pipeline.push({ $match: { "studentDetails.district": entity } });
    }

    // 3. Sort & Rank using Window Fields
    pipeline.push(
      { $sort: { totalMarks: -1 } },
      {
        $setWindowFields: {
          sortBy: { totalMarks: -1 },
          output: {
            rank: { $rank: {} }, // Calculates rank dynamically
          },
        },
      },
      { $limit: Number(limit) },
      // 4. Clean up output
      {
        $project: {
          _id: 1,
          totalMarks: 1,
          percentage: 1,
          grade: 1,
          rank: 1,
          "studentDetails.name": 1,
          "studentDetails.rollNumber": 1,
          "studentDetails.school": 1,
          "studentDetails.district": 1,
        },
      },
    );

    const rankings = await Result.aggregate(pipeline);
    res.json(rankings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching rankings",
      error: error,
      success: false,
    });
  }
};

// @desc    Get Individual Student Report Data
// @route   GET /api/results/report/:rollNumber
export const getStudentReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { rollNumber } = req.params;

    // 1. Find Student
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // 2. Find Result
    const result = await Result.findOne({ student: student._id });
    if (!result) {
      res.status(404).json({ message: "Result not found" });
      return;
    }

    // 3. Get Class Average Stats (For "Performance vs Class" chart)
    const stats = await Result.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      { $match: { "s.class": student.class } }, // Only compare with same class
      {
        $group: {
          _id: null,
          avgTotal: { $avg: "$totalMarks" },
          maxTotal: { $max: "$totalMarks" },
          avgPercentage: { $avg: "$percentage" },
        },
      },
    ]);

    // 4. Calculate Ranks on the fly
    // Count how many people have MORE marks than this student
    const nationalRankCount = await Result.countDocuments({
      totalMarks: { $gt: result.totalMarks },
    });

    // For school rank, we need a complex query to join and filter
    const schoolRankCount = await Result.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      {
        $match: {
          "s.school": student.school,
          totalMarks: { $gt: result.totalMarks },
        },
      },
      { $count: "count" },
    ]);

    res.json({
      student,
      result,
      comparison: stats[0] || {},
      ranks: {
        school: (schoolRankCount[0]?.count || 0) + 1,
        national: nationalRankCount + 1,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error generating report",
        error: error,
        success: false,
      });
  }
};
