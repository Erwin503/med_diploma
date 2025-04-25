import express from "express";
import * as qrCodeController from "../controllers/qrCodeController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/generate",
  authenticateToken,
  qrCodeController.generateQrForSession
);
router.get("/access/:token", qrCodeController.getSessionFromQrToken); // Публичный

export default router;
