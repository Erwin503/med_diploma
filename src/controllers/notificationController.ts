import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import { sendEmail } from "../utils/mailService";
import { buildSessionEmailContent } from "../utils/mailService";

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await knex("Notifications")
      .where({ user_id: req.user.id })
      .orderBy("created_at", "desc");

    res.status(200).json(notifications);
  } catch (err) {
    logger.error("Ошибка получения уведомлений", { error: err });
    next(err);
  }
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const updated = await knex("Notifications")
      .where({ id, user_id: req.user.id })
      .update({ read: true });

    if (!updated) {
      return res.status(404).json({ message: "Уведомление не найдено" });
    }

    res.status(200).json({ message: "Уведомление прочитано" });
  } catch (err) {
    logger.error("Ошибка отметки уведомления", { error: err });
    next(err);
  }
};

export const sendBookingConfirmationEmail = async (
  userId: number,
  sessionId: number
): Promise<void> => {
  const user = await knex("Users")
    .select("id", "email", "name")
    .where({ id: userId })
    .first();

  if (!user || !user.email) {
    logger.warn("Пользователь не найден или отсутствует email", { userId });
    return;
  }

  const { subject, html } = await buildSessionEmailContent(
    sessionId,
    user.name || "Клиент"
  );

  await sendEmail(user.email, subject, html, "Запись в очередь");
};

export const createNotification = async (
  userId: number,
  title: string,
  message?: string
) => {
  try {
    await knex("Notifications").insert({
      user_id: userId,
      title,
      message,
    });
  } catch (err) {
    logger.error("Ошибка создания уведомления", { error: err });
  }
};
