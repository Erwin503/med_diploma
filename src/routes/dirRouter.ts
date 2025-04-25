import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import { addDirection, getAllDirections, getDirectionById, deleteDirection, updateDirection } from "../controllers/dirController";

const router = express.Router();

// Публичные маршруты (просмотр)
router.get("/", getAllDirections);
router.get("/:id", getDirectionById);

// Остальные маршруты — только для админов
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

// Создание направления
router.post("/", addDirection);

// Обновление направления
router.put("/:id", updateDirection);

// Удаление направления
router.delete("/:id", deleteDirection);

export default router;
