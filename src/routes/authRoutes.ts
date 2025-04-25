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

// Регистрация
router.post("/", signup);
router.post("/signup", signup);

// Вход
router.post("/login", login);

// Выход
router.post("/logout", authenticateToken, logout);

// Профиль текущего пользователя
router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);
router.delete("/profile", authenticateToken, deleteUserProfile);

export default router;
