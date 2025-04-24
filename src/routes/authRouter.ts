import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import * as authController from "../controllers/authController";
import * as adminController from "../controllers/adminController";

const router = express.Router();

// ----------------
// Authentication
// ----------------

// Регистрация
router.post("/signup", authController.signup);

// Вход
router.post("/login", authController.login);

// Выход
router.post("/logout", authenticateToken, authController.logout);

// ----------------
// Profile (для всех авторизованных)
// ----------------

// Просмотр своего профиля
router.get("/profile", authenticateToken, authController.getUserProfile);

// Обновление своего профиля
router.put("/profile", authenticateToken, authController.updateUserProfile);

// Удаление своего аккаунта
router.delete("/profile", authenticateToken, authController.deleteUserProfile);

// ----------------
// Admin: управление пользователями
// ----------------

// Список пользователей (local_admin, super_admin)
router.get(
  "/users",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  adminController.getAllUsers
);

// Просмотр пользователя по ID (local_admin, super_admin)
router.get(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  adminController.getUserById
);

// Обновление пользователя (local_admin, super_admin)
router.put(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  adminController.updateUserByAdmin
);

// Удаление пользователя (local_admin, super_admin)
router.delete(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  adminController.deleteUserByAdmin
);

// Назначение роли (local_admin, super_admin)
router.post(
  "/users/assign-role",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  adminController.assignRoleToUser
);

export default router;
