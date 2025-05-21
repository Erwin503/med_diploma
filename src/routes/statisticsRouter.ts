import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import { getAttendanceByDirection, getCancellationDynamics, getLoadHeatmap } from "../controllers/statisticsController";

const router = express.Router();

// Все статистические эндпоинты доступны только администраторам
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

// Только для локальных и супер-админов
router.get(
  "/direction", getAttendanceByDirection
);

router.get("/directions", getAttendanceByDirection);
router.get("/cancellations", getCancellationDynamics);
router.get("/load-heatmap", getLoadHeatmap);

export default router;



