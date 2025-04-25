import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import { getAttendanceByDirection } from "../controllers/statisticsController";

const router = express.Router();

// Только для локальных и супер-админов
router.get(
  "/direction",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]), getAttendanceByDirection
);

export default router;
