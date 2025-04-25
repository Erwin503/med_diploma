import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import logger from "../utils/logger";

export const generateQrForSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "number") {
    res
      .status(400)
      .json({ error: "sessionId обязателен и должен быть числом" });
    return;
  }

  try {
    // Проверяем, существует ли сессия
    const session = await knex("Sessions").where({ id: sessionId }).first();
    if (!session) {
      res.status(404).json({ error: "Сессия не найдена" });
      return;
    }

    // Генерируем токен и ссылку
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    const url = `${
      process.env.BASE_URL || "http://localhost:3000"
    }/api/qr/access/${token}`;

    // Сохраняем токен
    await knex("queueqrtokens").insert({
      token,
      session_id: sessionId,
      expires_at: expiresAt,
      used: false,
    });

    // Генерируем QR
    const qrCode = await QRCode.toDataURL(url);

    res.status(201).json({
      token,
      sessionId,
      expiresAt,
      url,
      qrCode,
    });
  } catch (err) {
    logger.error("Ошибка генерации QR", { error: err });
    next(err);
  }
};

export const getQrCodeTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = 12;
    const sessions = [{ text: "test" }];

    res.status(200).json(sessions);
  } catch (err) {
    logger.error("Error fetching user sessions", { error: err });
    next(err);
  }
};

export const getSessionFromQrToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.params;

  try {
    const qrToken = await knex("queueqrtokens").where({ token }).first();

    if (!qrToken) {
      res.status(404).json({ message: "QR-код не найден" });
      return;
    }

    const now = new Date();

    if (qrToken.expires_at < now) {
      res.status(410).json({ message: "QR-код истёк" });
      return;
    }

    res.status(200).json({
      sessionId: qrToken.session_id,
      message: "QR действителен",
    });
  } catch (err) {
    logger.error("Ошибка при обработке QR-доступа", { error: err });
    next(err);
  }
};
