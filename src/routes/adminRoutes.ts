import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import {
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
  assignRoleToUser,
  getEmployeesByDistrict,
} from "../controllers/adminController";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Управление пользователями и ролями (доступно только администраторам)
 *
 * components:
 *   schemas:
 *     UserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *     AssignRoleRequest:
 *       type: object
 *       required:
 *         - userId
 *         - role
 *       properties:
 *         userId:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, employee, local_admin, super_admin]
 */

// Защита всех маршрутов авторизацией и проверкой роли
// router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

/**
 * @openapi
 * /admin:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSummary'
 */
router.get("/",authenticateToken, checkRole(["local_admin", "super_admin"]), getAllUsers);

/**
 * @openapi
 * /admin/{id}:
 *   get:
 *     summary: Получить информацию о пользователе по ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSummary'
 *       '404':
 *         description: Пользователь не найден
 */
router.get("/:id", authenticateToken, checkRole(["local_admin", "super_admin"]), getUserById);

/**
 * @openapi
 * /admin/{id}:
 *   put:
 *     summary: Обновить данные пользователя по ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Пользователь обновлён
 *       '400':
 *         description: Ошибка валидации
 *       '404':
 *         description: Пользователь не найден
 */
router.put("/:id", authenticateToken, checkRole(["local_admin", "super_admin"]), updateUserByAdmin);

/**
 * @openapi
 * /admin/{id}:
 *   delete:
 *     summary: Удалить пользователя по ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Пользователь удалён
 *       '404':
 *         description: Пользователь не найден
 */
router.delete("/:id", authenticateToken, checkRole(["local_admin", "super_admin"]), deleteUserByAdmin);

/**
 * @openapi
 * /admin/assign-role:
 *   post:
 *     summary: Назначить роль пользователю
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleRequest'
 *     responses:
 *       '200':
 *         description: Роль успешно назначена
 *       '400':
 *         description: Ошибка валидации или пользователь не найден
 */
router.post("/assign-role", authenticateToken, checkRole(["local_admin", "super_admin"]), assignRoleToUser);

/**
 * @openapi
 * /admin/district/{id}/employees:
 *   get:
 *     summary: Получить сотрудников по ID района
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Список сотрудников
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSummary'
 */
router.get("/district/:id/employees", getEmployeesByDistrict);

export default router;
