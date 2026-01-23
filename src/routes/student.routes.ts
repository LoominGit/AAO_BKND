import express from "express";
import {
  importStudentData,
  getStudents,
} from "../controllers/student.controller.js";

const router = express.Router();

router.post("/import", importStudentData); // For Excel Upload
router.get("/", getStudents); // For Student List Page

export default router;
