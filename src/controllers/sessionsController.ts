import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi, { ValidationErrorItem } from "joi";

import { Knex } from "knex";
import { SessionStatus } from "../enum/sessionEnum";
import {
  createNotification,
  sendBookingConfirmationEmail,
} from "./notificationController";

// Включаем подробное логирование в dev
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схема валидации для бронирования сессии
const bookSchema = Joi.object({
  working_hour_id: Joi.number().integer().required(),
  district_id: Joi.number().integer().min(1).default(1),
  direction_id: Joi.number().integer().required(),
});

// Бронирование сессии
export const bookSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация входных данных
  const { error, value } = bookSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d: ValidationErrorItem) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }
  const { working_hour_id, district_id, direction_id } = value;

  const trx = await knex.transaction();
  try {
    // Проверяем направление
    const direction = await trx("Directions")
      .where({ id: direction_id })
      .first();
    if (!direction) {
      res.status(404).json({ message: "Direction not found" });
      await trx.rollback();
      return;
    }

    // Проверяем рабочий час
    const workingHour = await trx("WorkingHours")
      .where({ id: working_hour_id })
      .first();
    if (!workingHour) {
      res.status(404).json({ message: "Working hour not found" });
      await trx.rollback();
      return;
    }
    if (workingHour.status === "booked") {
      res.status(400).json({ message: "This working hour is already booked" });
      await trx.rollback();
      return;
    }

    // Создаём сессию
    const [sessionId] = await trx("Sessions").insert({
      user_id: req.user.id,
      district_id,
      direction_id,
      working_hour_id,
      status: SessionStatus.BOOKED,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });

    // Обновляем статус рабочего часа
    await trx("WorkingHours")
      .where({ id: working_hour_id })
      .update({ status: "booked", updated_at: trx.fn.now() });

    await trx.commit();

    logDebug("Session booked", { sessionId, working_hour_id, direction_id });
    await sendBookingConfirmationEmail(req.user.id, sessionId);
    res.status(201).json({ message: "Session booked", sessionId });
  } catch (err) {
    await trx.rollback();
    logger.error("Error booking session", { error: err });
    next(err);
  }
};

// Завершение сессии
export const completeSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const trx = await knex.transaction();
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { comments } = req.body;

    // Обновляем статус сессии
    const updatedCount = await trx("Sessions")
      .where({ id: sessionId })
      .update({
        status: SessionStatus.COMPLETED,
        comments: comments || null,
        updated_at: trx.fn.now(),
      });
    if (!updatedCount) {
      res.status(404).json({ message: "Session not found" });
      await trx.rollback();
      return;
    }

    // Получаем рабочий час
    const session = await trx("Sessions")
      .select("working_hour_id")
      .where({ id: sessionId })
      .first();
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      await trx.rollback();
      return;
    }

    // Освобождаем рабочий час
    await trx("WorkingHours")
      .where({ id: session.working_hour_id, status: "booked" })
      .update({ status: "available", updated_at: trx.fn.now() });

    await trx.commit();
    res
      .status(200)
      .json({ message: "Session completed and working hour released" });
  } catch (err) {
    await trx.rollback();
    logger.error("Error completing session", { error: err });
    next(err);
  }
};
// Отмена сессии
export const cancelSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const trx = await knex.transaction();
  try {
    const sessionId = parseInt(req.params.id, 10);

    // Обновляем статус
    const updatedCount = await trx("Sessions").where({ id: sessionId }).update({
      status: SessionStatus.CANCELED,
      updated_at: trx.fn.now(),
    });
    if (!updatedCount) {
      res.status(404).json({ message: "Session not found" });
      await trx.rollback();
      return;
    }

    // Получаем рабочий час
    const session = await trx("Sessions")
      .select("working_hour_id")
      .where({ id: sessionId })
      .first();
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      await trx.rollback();
      return;
    }

    // Освобождаем рабочий час
    await trx("WorkingHours")
      .where({ id: session.working_hour_id, status: "booked" })
      .update({ status: "available", updated_at: trx.fn.now() });

    await trx.commit();
    res
      .status(200)
      .json({ message: "Session canceled and working hour released" });
  } catch (err) {
    await trx.rollback();
    logger.error("Error canceling session", { error: err });
    next(err);
  }
};

// Получение сессий текущего пользователя
export const getUserSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const sessions = await knex("Sessions as s")
      .leftJoin("WorkingHours as wh", "s.working_hour_id", "wh.id")
      .leftJoin("Directions as d", "s.direction_id", "d.id")
      .select(
        "s.id",
        "s.status",
        "wh.specific_date",
        "wh.day_of_week",
        "wh.start_time",
        "wh.end_time",
        "d.name as direction_name"
      )
      .where("s.user_id", userId)
      .orderBy("wh.specific_date", "asc")
      .orderBy("wh.start_time", "asc");

    res.status(200).json(sessions);
  } catch (err) {
    logger.error("Error fetching user sessions", { error: err });
    next(err);
  }
};

export const changeStatusSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { status: newStatus } = req.body;
  const sessionId = parseInt(req.params.id, 10);

  const user = req.user;

  if (!user || !isEmployee(user.role)) {
    res.status(403).json({ message: "Доступ только для сотрудников" });
    return;
  }

  const trx = await knex.transaction();

  try {
    // TODO: если нужно — добавить проверку, обслуживает ли сотрудник данную сессию

    const resultId = await updateSessionStatus(newStatus, sessionId, trx);

    if (!resultId) {
      await trx.rollback();
      res.status(404).json({ message: "Сессия не найдена" });
      return;
    }

    await trx.commit();

    res.status(200).json({
      message: `Статус сессии обновлён на ${newStatus}`,
      sessionId: resultId,
      status: newStatus,
    });

    // TO DO: Изменить тему и содержание
    createNotification(
      user.id,
      "Смена статуса",
      "internal",
      `Здравствуйте, ${user.id}, запись №${sessionId} сменила статус на ${newStatus}!`
    );

    await sendBookingConfirmationEmail(user.id, sessionId);
  } catch (err) {
    await trx.rollback();
    logger.error("Ошибка при смене статуса", { error: err });
    next(err);
  }
};

const updateSessionStatus = async (
  status: string,
  sessionId: number,
  trx: Knex.Transaction
): Promise<number | null> => {
  const session = await trx("Sessions").where({ id: sessionId }).first();

  if (!session) return null;

  await trx("Sessions").where({ id: sessionId }).update({
    status,
    updated_at: new Date(),
  });

  return session.id;
};

const isEmployee = (role: string): boolean => {
  return role === "employee";
};

const isLocalAdmin = (role: string): boolean => {
  return role === "local_admin";
};

const isSuperAdmin = (role: string): boolean => {
  return role === "super_admin";
};
