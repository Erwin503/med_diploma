import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { Knex } from "knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi from "joi";
import { SessionStatus } from "../enum/sessionEnum";
import {
  createNotification,
  sendBookingConfirmationEmail,
} from "./notificationController";

// Таблицы и алиасы
const WH_TABLE = "WorkingHours";
const WH_ALIAS = "wh";
const SESS_TABLE = "Sessions";
const SESS_ALIAS = "s";
const DIST_TABLE = "Districts";
const TABLE_WH = `${WH_TABLE} as ${WH_ALIAS}`;
const TABLE_SESS = `${SESS_TABLE} as ${SESS_ALIAS}`;

// Условное debug-логирование
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схемы валидации
const bookSchema = Joi.object({
  working_hour_id: Joi.number().integer().required(),
  district_id: Joi.number().integer().default(1),
  user_id: Joi.number().integer(), // admin only
});
const completeSchema = Joi.object({
  training_type: Joi.string().optional(),
  comments: Joi.string().optional(),
});

// Бронирование сессии
export const bookSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация запроса
  const { error, value } = bookSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
  }
  let clientId: number;
  if (isSuperAdmin(req.user.role) || isLocalAdmin(req.user.role)) {
    if (!value.user_id)
      res.status(400).json({ message: "user_id is required for admins" });
    clientId = value.user_id;
  } else {
    clientId = req.user.id;
  }

  try {
    // Проверяем слот
    const slot = await knex(TABLE_WH)
      .where(`${WH_ALIAS}.id`, value.working_hour_id)
      .first();
    if (!slot) res.status(404).json({ message: "Working hour not found" });
    if (slot.status === SessionStatus.BOOKED)
      res.status(400).json({ message: "Slot already booked" });

    // Создаем сессию
    const [session] = await knex(SESS_TABLE)
      .insert({
        user_id: clientId,
        working_hour_id: value.working_hour_id,
        district_id: value.district_id,
        status: slot.requires_confirmation
          ? SessionStatus.PENDING_CONFIRMATION
          : SessionStatus.BOOKED,
      })
      .returning("*");
    // Обновляем слот
    await knex(WH_TABLE)
      .where({ id: value.working_hour_id })
      .update({ status: "booked" });

    logDebug("Session booked", { session });
    await sendBookingConfirmationEmail(clientId, session.id);
    res.status(201).json({ message: "Booked successfully", session });
  } catch (err) {
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
  const { error, value } = completeSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
  }
  const sessionId = parseInt(req.params.id, 10);
  const trx = await knex.transaction();
  try {
    // Проверяем права: админ или сотрудник для своего слота
    const sess = await trx(TABLE_SESS)
      .leftJoin(TABLE_WH, `${SESS_ALIAS}.working_hour_id`, `${WH_ALIAS}.id`)
      .where(`${SESS_ALIAS}.id`, sessionId)
      .first();
    if (!sess) {
      await trx.rollback();
      res.status(404).json({ message: "Session not found" });
    }
    if (isEmployee(req.user.role) && sess.employee_id !== req.user.id) {
      await trx.rollback();
      res.status(403).json({ message: "Access denied" });
    }

    // Обновляем сессию
    await trx(SESS_TABLE).where({ id: sessionId }).update({
      status: SessionStatus.COMPLETED,
      training_type: value.training_type,
      comments: value.comments,
      updated_at: new Date(),
    });
    // Освобождаем слот
    if (sess.status === SessionStatus.COMPLETED) {
      await trx(WH_TABLE)
        .where({ id: sess.working_hour_id })
        .update({ status: "available", updated_at: new Date() });
    }
    await trx.commit();
    logDebug("Session completed", { sessionId });
    res.status(200).json({ message: "Session completed" });
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
  const sessionId = parseInt(req.params.id, 10);
  const trx = await knex.transaction();
  try {
    // Получаем сессию и слот
    const sess = await trx(TABLE_SESS)
      .leftJoin(TABLE_WH, `${SESS_ALIAS}.working_hour_id`, `${WH_ALIAS}.id`)
      .where(`${SESS_ALIAS}.id`, sessionId)
      .first();
    if (!sess) {
      await trx.rollback();
      res.status(404).json({ message: "Session not found" });
    }
    // Проверка прав
    const oneDayMs = 24 * 60 * 60 * 1000;
    const slotDate = new Date(`${sess.specific_date}T${sess.start_time}`);
    const now = new Date();
    const isAdmin = isSuperAdmin(req.user.role) || isLocalAdmin(req.user.role);
    const isClient = !isEmployee(req.user.role) && sess.user_id === req.user.id;
    const isEmployeeOwner =
      isEmployee(req.user.role) && sess.employee_id === req.user.id;
    if (!isAdmin) {
      if (!(isClient || isEmployeeOwner)) {
        await trx.rollback();
        res.status(403).json({ message: "Access denied" });
      }
      if (slotDate.getTime() - now.getTime() < oneDayMs) {
        await trx.rollback();
        res
          .status(400)
          .json({ message: "Cannot cancel less than 1 day before" });
      }
    }

    // Отмена
    const updated = await updateSessionStatus("canceled", sessionId, trx);
    if (!updated) {
      await trx.rollback();
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (sess.status === "booked") {
      await trx(WH_TABLE)
        .where({ id: sess.working_hour_id })
        .update({ status: "available", updated_at: now });
    }
    await trx.commit();

    logDebug("Session canceled", { sessionId });
    res.status(200).json({ message: "Session canceled" });
  } catch (err) {
    await trx.rollback();
    logger.error("Error canceling session", { error: err });
    next(err);
  }
};

// Получение своих сессий (клиент или админ, но только свои записки)
export const getUserSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const sessions = await knex(TABLE_SESS)
      .leftJoin(TABLE_WH, `${SESS_ALIAS}.working_hour_id`, `${WH_ALIAS}.id`)
      .leftJoin("Users as employees", `${WH_ALIAS}.employee_id`, "employees.id")
      .leftJoin("Districts as d", `${SESS_ALIAS}.district_id`, "d.id")
      .select(
        `${SESS_ALIAS}.id as session_id`,
        `${SESS_ALIAS}.status`,
        `${WH_ALIAS}.specific_date`,
        `${WH_ALIAS}.day_of_week`,
        `${WH_ALIAS}.start_time`,
        `${WH_ALIAS}.end_time`,
        `employees.name as employee_name`,
        `d.name as district_name`
      )
      .where(`${SESS_ALIAS}.user_id`, userId)
      .orderBy(`${WH_ALIAS}.specific_date`, "asc");

    logDebug("Fetched user sessions", { userId, count: sessions.length });
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

    createNotification(
      user.id,
      "Смена статуса",
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
  const session = await trx(SESS_TABLE).where({ id: sessionId }).first();

  if (!session) return null;

  await trx(SESS_TABLE).where({ id: sessionId }).update({
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
