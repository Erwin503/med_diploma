import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { checkRole } from "../middleware/checkRole";

// Импортируем из authController
import {
  signup,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "../controllers/authController";

// Импортируем из adminController
import {
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
  assignRoleToUser,
} from "../controllers/adminController";

const router = express.Router();

// --- Auth routes ---
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);

router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);
router.delete("/profile", authenticateToken, deleteUserProfile);

// --- Admin routes ---
router.get(
  "/users",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  getAllUsers
);
router.get(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  getUserById
);
router.put(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  updateUserByAdmin
);
router.delete(
  "/users/:id",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  deleteUserByAdmin
);
router.post(
  "/users/assign-role",
  authenticateToken,
  checkRole(["local_admin", "super_admin"]),
  assignRoleToUser
);

export default router;
