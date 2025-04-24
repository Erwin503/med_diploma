import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as districtController from "../controllers/districtController";

const router = express.Router();

// Public: получить все отделы
router.get(
  "/",
  districtController.getAllDistricts
);

// Public: получить отдел по ID
router.get(
  "/:id",
  districtController.getDistrictById
);

// Protected: создание отдела (только super_admin)
router.post(
  "/",
  authenticateToken,
  
  districtController.addDistrict
);

// Protected: обновление отдела (только super_admin)
router.put(
  "/:id",
  authenticateToken,
  districtController.updateDistrict
);

// Protected: удаление отдела (только super_admin)
router.delete(
  "/:id",
  authenticateToken,
  districtController.deleteDistrict
);

export default router;
