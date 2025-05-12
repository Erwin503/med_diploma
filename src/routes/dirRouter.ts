import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import {
  addDirection,
  getAllDirections,
  getDirectionById,
  deleteDirection,
  updateDirection
} from "../controllers/dirController";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Directions
 *     description: Управление направлениями (медицинскими, профильными)
 *
 * components:
 *   schemas:
 *     Direction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     DirectionInput:
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
 * /dir:
 *   get:
 *     summary: Получить список направлений
 *     tags:
 *       - Directions
 *     responses:
 *       '200':
 *         description: Успешный ответ — список направлений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Direction'
 */
router.get("/", getAllDirections);

/**
 * @openapi
 * /dir/{id}:
 *   get:
 *     summary: Получить направление по ID
 *     tags:
 *       - Directions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Успешный ответ — направление найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Direction'
 *       '404':
 *         description: Направление не найдено
 */
router.get("/:id", getDirectionById);

// Защищённые маршруты для админов
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

/**
 * @openapi
 * /dir:
 *   post:
 *     summary: Создать новое направление
 *     tags:
 *       - Directions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DirectionInput'
 *     responses:
 *       '201':
 *         description: Направление создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Direction'
 *       '400':
 *         description: Ошибка валидации данных
 */
router.post("/", addDirection);

/**
 * @openapi
 * /dir/{id}:
 *   put:
 *     summary: Обновить направление по ID
 *     tags:
 *       - Directions
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
 *             $ref: '#/components/schemas/DirectionInput'
 *     responses:
 *       '200':
 *         description: Направление обновлено
 *       '404':
 *         description: Направление не найдено
 */
router.put("/:id", updateDirection);

/**
 * @openapi
 * /dir/{id}:
 *   delete:
 *     summary: Удалить направление по ID
 *     tags:
 *       - Directions
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
 *         description: Направление удалено
 *       '404':
 *         description: Направление не найдено
 */
router.delete("/:id", deleteDirection);

export default router;
