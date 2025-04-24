import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as sessionController from "../controllers/sessionsController";

const router = express.Router();

// Бронирование сессии (сам клиент для себя или админ для любого клиента)
// POST /sessions
router.post("/", authenticateToken, sessionController.bookSession);

// Завершение сессии (сотрудник для своей записи или админ для любой)
// PATCH /sessions/:id/complete
router.patch(
  "/:id/complete",
  authenticateToken,
  sessionController.completeSession
);

// Отмена сессии (клиент или сотрудник для своей записи за ≥1 день, или админ без ограничений)
// PATCH /sessions/:id/cancel
router.patch("/:id/cancel", authenticateToken, sessionController.cancelSession);

// Получение своих сессий (клиент или админ, но только свои записи)
// GET /sessions
router.get("/", authenticateToken, sessionController.getUserSessions);

export default router;
