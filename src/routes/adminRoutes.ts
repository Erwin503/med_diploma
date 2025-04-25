import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";
import {
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
  assignRoleToUser,
} from "../controllers/adminController";

const router = express.Router();

// Все роуты защищены и доступны только локальным и супер-админам
router.use(authenticateToken, checkRole(["local_admin", "super_admin"]));

// CRUD пользователей
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserByAdmin);
router.delete("/:id", deleteUserByAdmin);

// Назначение ролей
router.post("/assign-role", assignRoleToUser);

export default router;
