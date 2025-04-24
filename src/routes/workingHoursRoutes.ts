import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as workingHoursController from "../controllers/workingHoursController";

const router = express.Router();

// Публичный просмотр расписания любого сотрудника по ID
// GET /working-hours/:id
router.get(
  "/:id",
  workingHoursController.getEmployeeScheduleByID
);

// Все следующие маршруты — только для авторизованных сотрудников и админов
router.use(authenticateToken);

// Просмотр своего расписания
// GET /working-hours
router.get(
  "/",
  workingHoursController.getWorkingHours
);

// Добавление рабочего времени
// POST /working-hours
router.post(
  "/",
  workingHoursController.addWorkingHours
);

// Обновление рабочего времени по его ID
// PUT /working-hours/:id
router.put(
  "/:id",
  workingHoursController.updateWorkingHours
);

// Удаление рабочего времени по его ID
// DELETE /working-hours/:id
router.delete(
  "/:id",
  workingHoursController.deleteWorkingHours
);

export default router;
