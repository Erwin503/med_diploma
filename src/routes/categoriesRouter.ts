import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import * as categoryController from "../controllers/categoriesController";

const router = express.Router();

// Публичные маршруты (просмотр)
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Защищённые маршруты для супера и локального админа
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

// Создание категории
router.post("/", categoryController.addCategory);

// Обновление категории
router.put("/:id", categoryController.updateCategory);

// Удаление категории
router.delete("/:id", categoryController.deleteCategory);

export default router;
