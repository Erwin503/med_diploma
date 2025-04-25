import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import logger from "../utils/logger";
import { generateSessionQrCode } from "../utils/qrService";
import { AuthRequest } from "../middleware/authMiddleware";

export const generateQrForSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.body;
  const user = req.user;

  // Проверка авторизации
  if (!user) {
    res.status(401).json({ error: "Неавторизованный доступ" });
    return;
  }

  // Валидация sessionId
  if (!sessionId || typeof sessionId !== "number") {
    res.status(400).json({
      error: "sessionId обязателен и должен быть числом",
    });
    return;
  }

  try {
    // Если пользователь обычный, проверим, что он владелец сессии
    if (user.role === "user") {
      const session = await knex("Sessions")
        .select("id", "user_id")
        .where({ id: sessionId })
        .first();

      if (!session) {
        res.status(404).json({ error: "Сессия не найдена" });
        return;
      }

      if (session.user_id !== user.id) {
        res.status(403).json({ error: "Доступ запрещён к чужой сессии" });
        return;
      }
    }

    // Генерация QR-кода
    const { token, expiresAt, url, qrCode } = await generateSessionQrCode(
      sessionId
    );

    res.status(201).json({
      token,
      sessionId,
      expiresAt,
      url,
      qrCode,
    });
    return;
  } catch (err: any) {
    logger.error("Ошибка генерации QR", { error: err });
    res.status(500).json({
      error: err.message || "Внутренняя ошибка при генерации QR",
    });
    return;
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

    if (qrToken.expires_at && qrToken.expires_at < now) {
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
