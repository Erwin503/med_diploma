import express from "express";
import {
  getNotifications,
  markNotificationRead,
} from "../controllers/notificationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Получить все уведомления текущего пользователя
router.get("/", authenticateToken, getNotifications);

// Отметить уведомление как прочитанное
router.put("/:id/read", authenticateToken, markNotificationRead);

export default router;
