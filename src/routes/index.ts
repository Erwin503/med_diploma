import express from "express";
import userRoutes from "./authRouter";
import districtRoutes from "./districtRouter";
import trainerWorkingHoursRoutes from './trainerWorkingHoursRoutes';
import trainingSessionsRoutes from './trainingSessionsRoutes';
import employeeDetailsRoutes from "./employeeDetailsRoutes";

const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// Подключение маршрутов для залов
router.use("/districts", districtRoutes);

// Подключение маршрутов для информации о тренерах
router.use("/employee-details", employeeDetailsRoutes);

router.use("/working-hours", workingHoursRoutes); // CRUD для рабочих часов тренера

router.use("/training-sessions", trainingSessionsRoutes); // CRUD для сессий

export default router;
