import express from "express";
import userRoutes from "./authRoutes";
import districtRoutes from "./districtRoutes";
import workingHoursRoutes from "./workingHoursRoutes";
import sessionsRoutes from "./sessionsRoutes";
import qrCodeRoutes from "./qrCodeRoutes";
import employeeDetailsRoutes from "./employeeDetailsRoutes";
import adminRouter from "./adminRoutes";
import categoryRoutes from "./categoriesRouter";
import dirRoutes from "./dirRouter";
import statRouter from "./statisticsRouter";

const router = express.Router();

// Подключение маршрутов для пользователей
router.use("/users", userRoutes);

// админское управление пользователями
router.use("/admin", adminRouter)

// Подключение маршрутов для отделов
router.use("/districts", districtRoutes);

// Подключение маршрутов для категорий
router.use("/categories", categoryRoutes);

// Подключение маршрутов для категорий
router.use("/dir", dirRoutes);

// Подключение маршрутов для информации о сотрудниках
router.use("/employee-details", employeeDetailsRoutes);

router.use("/working-hours", workingHoursRoutes); // CRUD для рабочих часов сотрудника

router.use("/sessions", sessionsRoutes); // CRUD для записей
router.use("/qr", qrCodeRoutes); // QR routers

router.use("/stats", statRouter); // CRUD для записей

export default router;
