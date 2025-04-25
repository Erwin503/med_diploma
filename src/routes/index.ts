import express from "express";
import userRoutes from "./authRouter";
import districtRoutes from "./districtRouter";
import workingHoursRoutes from "./workingHoursRoutes";
import sessionsRoutes from "./sessionsRoutes";
import qrCodeRoutes from "./qrCodeRoutes";
import employeeDetailsRoutes from "./employeeDetailsRoutes";

const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// Подключение маршрутов для залов
router.use("/districts", districtRoutes);

// Подключение маршрутов для информации о сотрудниках
router.use("/employee-details", employeeDetailsRoutes);

router.use("/working-hours", workingHoursRoutes); // CRUD для рабочих часов сотрудника

router.use("/sessions", sessionsRoutes); // CRUD для записей
router.use("/qr", qrCodeRoutes); // QR routers

export default router;
