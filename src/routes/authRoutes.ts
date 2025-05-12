import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  signup,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../controllers/authController";

const router = express.Router();

// /**
//  * @openapi
//  * tags:
//  *   - name: Auth
//  *     description: Аутентификация и профиль пользователя
//  *
//  * components:
//  *   schemas:
//  *     Credentials:
//  *       type: object
//  *       required:
//  *         - email
//  *         - password
//  *       properties:
//  *         email:
//  *           type: string
//  *           format: email
//  *         password:
//  *           type: string
//  *           minLength: 6
//  *     UserProfile:
//  *       type: object
//  *       properties:
//  *         id:
//  *           type: string
//  *         email:
//  *           type: string
//  *           format: email
//  *         name:
//  *           type: string
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

// /**
//  * @openapi
//  * /users:
//  *   post:
//  *     summary: Зарегистрировать нового пользователя
//  *     tags:
//  *       - Auth
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Credentials'
//  *     responses:
//  *       '201':
//  *         description: Пользователь успешно зарегистрирован
//  *       '400':
//  *         description: Ошибка валидации данных
//  */
// router.post("/", signup);
/**
 * @openapi
 * components:
 *   schemas:
 *     SignupInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *       example:
 *         email: "admin@example.com"
 *         password: "password123"
 *         name: "Ervin"
 *         phone: "878"
 */

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Зарегистрировать нового пользователя
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupInput'
 *     responses:
 *       '201':
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       '400':
 *         description: Ошибка валидации данных
 */
router.post("/", signup);

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Войти в систему
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Credentials'
 *     responses:
 *       '200':
 *         description: Успешный вход, возвращает JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '401':
 *         description: Неверный email или пароль
 */
router.post("/login", login);

/**
 * @openapi
 * /users/logout:
 *   post:
 *     summary: Выйти (деактивировать токен)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: Успешный выход
 *       '401':
 *         description: Токен не предоставлен или недействителен
 */
router.post("/logout", authenticateToken, logout);

/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Профиль пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       '401':
 *         description: Неавторизованный
 */
router.get("/profile", authenticateToken, getUserProfile);

/**
 * @openapi
 * /users/profile:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       '200':
 *         description: Профиль обновлён
 *       '400':
 *         description: Ошибка валидации
 *       '401':
 *         description: Неавторизованный
 */
router.put("/profile", authenticateToken, updateUserProfile);

/**
 * @openapi
 * /users/profile:
 *   delete:
 *     summary: Удалить профиль текущего пользователя
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: Профиль удалён
 *       '401':
 *         description: Неавторизованный
 */
router.delete("/profile", authenticateToken, deleteUserProfile);

export default router;
