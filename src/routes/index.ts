import express from "express";
import userRoutes from "./authRoutes";
import districtRoutes from "./districtRoutes";
import workingHoursRoutes from "./workingHoursRoutes";
import sessionsRoutes from "./sessionsRoutes";
import employeeDetailsRoutes from "./employeeDetailsRoutes";
import adminRouter from "./adminRoutes";

const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// админское управление пользователями
router.use("/admin", adminRouter)

// Подключение маршрутов для залов
router.use("/districts", districtRoutes);

// Подключение маршрутов для информации о сотрудниках
router.use("/employee-details", employeeDetailsRoutes);

router.use("/working-hours", workingHoursRoutes); // CRUD для рабочих часов сотрудника

router.use("/sessions", sessionsRoutes); // CRUD для записей

export default router;
