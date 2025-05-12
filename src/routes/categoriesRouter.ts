import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import * as categoryController from "../controllers/categoriesController";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Управление категориями пользователей/сотрудников
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Получить все категории
 *     tags:
 *       - Categories
 *     responses:
 *       '200':
 *         description: Список категорий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/", categoryController.getAllCategories);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Получить категорию по ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Категория найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '404':
 *         description: Категория не найдена
 */
router.get("/:id", categoryController.getCategoryById);

// Защита для редактирования
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Добавить новую категорию
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       '201':
 *         description: Категория создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Ошибка валидации
 */
router.post("/", categoryController.addCategory);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Обновить категорию по ID
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       '200':
 *         description: Категория обновлена
 *       '404':
 *         description: Категория не найдена
 */
router.put("/:id", categoryController.updateCategory);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Удалить категорию по ID
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Категория удалена
 *       '404':
 *         description: Категория не найдена
 */
router.delete("/:id", categoryController.deleteCategory);

export default router;

