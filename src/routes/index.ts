import express from "express";
import userRoutes from "./authRoutes";
import districtRoutes from "./districtRoutes";
import workingHoursRoutes from "./workingHoursRoutes";
import sessionsRoutes from "./sessionsRoutes";
import qrCodeRoutes from "./qrCodeRoutes";
import employeeDetailsRoutes from "./employeeDetailsRoutes";
import adminRoutes from "./adminRoutes";
import categoryRoutes from "./categoriesRouter";
import dirRoutes from "./dirRouter";
import statRoutes from "./statisticsRouter";
import notificationRoutes from "./notificationRoutes";


const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// админское управление пользователями
router.use("/admin", adminRoutes);

// Подключение маршрутов для отделов
router.use("/districts", districtRoutes);

// Подключение маршрутов для категорий
router.use("/categories", categoryRoutes);

// Подключение маршрутов для категорий
router.use("/dir", dirRoutes);

// Подключение маршрутов для информации о сотрудниках
router.use("/employee-details", employeeDetailsRoutes);

router.use("/working-hours", workingHoursRoutes); // CRUD для рабочих часов сотрудника

// Подключение маршрутов для сессий
router.use("/sessions", sessionsRoutes);

// Подключение маршрутов для QR
router.use("/qr", qrCodeRoutes);

// Подключение маршрутов для уведомлений и писем
router.use("/notification", notificationRoutes);

// Подключение маршрутов для статистики
router.use("/stats", statRoutes);

export default router;
