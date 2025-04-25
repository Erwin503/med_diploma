import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import { mailTransporter } from "../utils/mailService";

// Получить уведомления пользователя
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

// Отметить уведомление как прочитанное
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

export const sendNotificationEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = 1;
    const user = await knex("Users")
      .select("id", "email", "name")
      .where({ id: userId })
      .first();
    const userEmail = "ibraimg403@gmail.com";
    if (!user || !userEmail) {
      logger.warn("Пользователь не найден или отсутствует email", { userId });
      return;
    }

    const mailOptions = {
      from: `"Система уведомлений" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Тест",
      text: "Тестируем почту",
    };

    await mailTransporter.sendMail(mailOptions);
    logger.info(`Письмо отправлено на ${userEmail}`);
    res.status(200).json({ message: "Уведомление отправлено на почту" });
  } catch (err) {
    logger.error("Ошибка при отправке email: " + err, { error: err });
  }
};

export const sendMail = async (
  userId: number,
  title: string,
  message?: string
) => {
  try {
    const user = await knex("Users")
      .select("id", "email", "name")
      .where({ id: userId })
      .first();
    const userEmail = "ibraimg403@gmail.com";
    if (!user || !userEmail) {
      logger.warn("Пользователь не найден или отсутствует email", { userId });
      return;
    }

    const mailOptions = {
      from: `"Система уведомлений" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: title,
      text: message || "",
    };

    await mailTransporter.sendMail(mailOptions);
    logger.info(`Письмо отправлено на ${userEmail}`);
  } catch (err) {
    logger.error("Ошибка при отправке email", { error: err });
  }
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
