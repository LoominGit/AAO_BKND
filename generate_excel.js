// generate_excel.js
import xlsx from "xlsx";

// Sample student data
const students = [
  {
    rollNumber: "AAO2024001",
    studentName: "Aarav Sharma",
    class: "10",
    section: "A",
    schoolName: "Delhi Public School",
    district: "South Delhi",
    state: "Delhi",
    math_score: 85,
    science_score: 90,
    english_score: 88,
    gk_score: 45,
  },
  {
    rollNumber: "AAO2024002",
    studentName: "Priya Patel",
    class: "10",
    section: "A",
    schoolName: "Delhi Public School",
    district: "South Delhi",
    state: "Delhi",
    math_score: 92,
    science_score: 95,
    english_score: 91,
    gk_score: 48,
  },
  {
    rollNumber: "AAO2024003",
    studentName: "Rahul Verma",
    class: "10",
    section: "B",
    schoolName: "St. Xavier School",
    district: "Central Mumbai",
    state: "Maharashtra",
    math_score: 78,
    science_score: 82,
    english_score: 80,
    gk_score: 40,
  },
  {
    rollNumber: "AAO2024004",
    studentName: "Ananya Gupta",
    class: "10",
    section: "A",
    schoolName: "DAV Public School",
    district: "Kolkata North",
    state: "West Bengal",
    math_score: 88,
    science_score: 85,
    english_score: 90,
    gk_score: 42,
  },
  {
    rollNumber: "AAO2024005",
    studentName: "Arjun Singh",
    class: "10",
    section: "C",
    schoolName: "Kendriya Vidyalaya",
    district: "Jaipur",
    state: "Rajasthan",
    math_score: 70,
    science_score: 75,
    english_score: 72,
    gk_score: 35,
  },
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(students);

// Adjust column widths for better readability
const wscols = [
  { wch: 15 }, // rollNumber
  { wch: 20 }, // studentName
  { wch: 5 }, // class
  { wch: 5 }, // section
  { wch: 25 }, // schoolName
  { wch: 15 }, // district
  { wch: 15 }, // state
  { wch: 10 }, // math
  { wch: 10 }, // science
  { wch: 10 }, // english
  { wch: 10 }, // gk
];
ws["!cols"] = wscols;

xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "students.xlsx");

console.log("✅ students.xlsx generated successfully!");
