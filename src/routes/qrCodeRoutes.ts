import express from "express";
import * as qrCodeController from "../controllers/qrCodeController";
import * as notificationController from "../controllers/notificationController";

const router = express.Router();

router.post("/generate", qrCodeController.generateQrForSession);
router.get("/testemail", notificationController.sendNotificationEmail);
router.get("/access/:token", qrCodeController.getSessionFromQrToken); // Публичный
// router.post("/", qrCodeController.getQrCodeTest);

export default router;
