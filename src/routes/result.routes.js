import express from "express";
import {
  getRankings,
  getStudentReport,
} from "../controllers/result.controller.js";

const router = express.Router();

router.get("/rankings", getRankings);
router.get("/report/:rollNumber", getStudentReport);

export default router;
