import express from "express";
import userRoutes from "./authRouter";
import gymRoutes from "./gymRouter";
import trainerScheduleRoutes from "./trainerScheduleRoutes";
import trainerDetailsRoutes from "./trainerDetailsRoutes";
import trainerWorkingHoursRoutes from './trainerWorkingHoursRoutes';
import trainingSessionsRoutes from './trainingSessionsRoutes';

const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// Подключение маршрутов для залов
router.use("/gyms", gymRoutes);

// Подключение маршрутов для расписания тренеров
router.use("/trainer-schedule", trainerScheduleRoutes);

// Подключение маршрутов для информации о тренерах
router.use("/trainer-details", trainerDetailsRoutes);

router.use("/trainer-working-hours", trainerWorkingHoursRoutes); // CRUD для рабочих часов тренера

router.use("/training-sessions", trainingSessionsRoutes); // CRUD для сессий

export default router;
