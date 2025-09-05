import express from "express";
import { getStudents, getStudentStats, setDifficulty, generateReport,  generateOperation, getDifficulty,
    deleteStudentData } from "../controllers/docenteController.js";

const router = express.Router();

router.get("/students", getStudents);
router.get("/stats/:studentId", getStudentStats);
router.post("/setDifficulty", setDifficulty);
router.get("/report/:studentId", generateReport);
router.get("/generateOperation", generateOperation);
router.get("/getDifficulty", getDifficulty);
router.delete("/deleteStudentData/:studentId", deleteStudentData);



export default router; // ✅ Esto soluciona el error
