import mongoose from "mongoose";
import Student from "../model/student.model.js";
import Result from "../model/result.model.js";
import xlsx from "xlsx"; // Import the parser

// @desc    Bulk Import Students & Results from Excel
// @route   POST /api/students/import
// @access  Private (Admin/Teacher)
export const importStudentData = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. CHECK FOR FILES
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const uploadedFile = req.files.file;
    const examId = req.body.examId || "AAO-2024";

    // 2. PARSE FILE
    const workbook = xlsx.readFile(uploadedFile.tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert Excel to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      res.status(400).json({ message: "Excel sheet is empty" });
      return;
    }

    // ✅ FIX: Explicitly type the operation arrays
    // using <any> allows flexibility with your specific Schema types
    const studentOps = [];
    const resultOps = [];

    // --- STEP 1: Prepare Student Upsert Operations ---
    for (const row of data) {
      studentOps.push({
        updateOne: {
          filter: { rollNumber: row.rollNumber },
          update: {
            $set: {
              name: row.studentName,
              class: row.class,
              section: row.section,
              school: row.schoolName,
              district: row.district,
              state: row.state,
            },
          },
          upsert: true,
        },
      });
    }

    // Execute Student Bulk Write
    if (studentOps.length > 0) {
      await Student.bulkWrite(studentOps, { session });
    }

    // --- STEP 2: Fetch Students ---
    const rollNumbers = data.map((d) => d.rollNumber);
    const students = await Student.find({
      rollNumber: { $in: rollNumbers },
    }).session(session);

    // Create Map for quick lookup
    const studentMap = new Map(students.map((s) => [s.rollNumber, s._id]));

    // --- STEP 3: Prepare Result Upsert ---
    for (const row of data) {
      const studentId = studentMap.get(row.rollNumber);

      // Skip if student wasn't created/found for some reason
      if (!studentId) continue;

      const math = Number(row.math_score) || 0;
      const science = Number(row.science_score) || 0;
      const english = Number(row.english_score) || 0;
      const gk = Number(row.gk_score) || 0;

      const totalMarks = math + science + english + gk;
      const percentage = (totalMarks / 400) * 100;

      let grade = "F";
      if (percentage >= 90) grade = "A+";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B";
      else if (percentage >= 60) grade = "C";

      resultOps.push({
        updateOne: {
          filter: { student: studentId, examId: examId }, // Removed subjectId: "all" if not in schema
          update: {
            $set: {
              sectionScores: {
                math,
                science,
                english,
                gk,
              },
              totalMarks,
              percentage,
              grade,
            },
          },
          upsert: true,
        },
      });
    }

    if (resultOps.length > 0) {
      await Result.bulkWrite(resultOps, { session });
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Import successful", count: data.length });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Import Error:", error);
    res
      .status(500)
      .json({ message: "Import failed", error: error, success: false });
  } finally {
    session.endSession();
  }
};

// @desc    Get All Students with Filtering
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      school,
      district,
      class: studentClass,
      search,
    } = req.query;

    const query = { isActive: true };

    if (school) query.school = school;
    if (district) query.district = district;
    if (studentClass) query.class = studentClass;

    // Search by Name or Roll Number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalStudents: total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while fetching students",
      error: error,
      success: false,
    });
  }
};
