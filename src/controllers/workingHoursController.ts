import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { WorkingHours } from "../interfaces/model";
import logger from "../utils/logger";
import { AuthRequest } from "../middleware/authMiddleware";
import Joi, { ValidationErrorItem } from "joi";

// Константы
const WH_TABLE = "WorkingHours";

// Условное debug-логирование
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схема валидации рабочего времени
const workingHoursSchema = Joi.object({
  employee_id: Joi.number().integer().optional(),
  day_of_week: Joi.string().optional(), // теперь просто строка
  specific_date: Joi.string().optional(), // тоже строка
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "start_time must be in HH:mm format",
      "any.required": "start_time is required",
    }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "end_time must be in HH:mm format",
      "any.required": "end_time is required",
    }),
});

// Добавление рабочего времени сотрудника
export const addWorkingHours = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация
  const { error, value } = workingHoursSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d: ValidationErrorItem) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  // Определяем targetEmployeeId
  let targetEmployeeId: number;
  if (["super_admin", "local_admin"].includes(req.user.role)) {
    if (!value.employee_id) {
      res.status(400).json({ message: "employee_id is required for admins" });
      return;
    }
    targetEmployeeId = value.employee_id;
  } else if (req.user.role === "employee") {
    targetEmployeeId = req.user.id;
  } else {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    logDebug(
      `Добавление рабочего времени для сотрудника ID: ${targetEmployeeId}`,
      { value }
    );

    // Вставка записи
    const [insertId] = await knex<WorkingHours>(WH_TABLE).insert({
      employee_id: targetEmployeeId,
      day_of_week: value.day_of_week,
      specific_date: value.specific_date,
      start_time: value.start_time,
      end_time: value.end_time,
    });

    // Чтение вставленной записи
    const workingHour = await knex<WorkingHours>(WH_TABLE)
      .where({ id: insertId })
      .first();

    logDebug(`Рабочее время добавлено (ID: ${workingHour?.id})`, {
      workingHour,
    });
    res
      .status(201)
      .json({ message: "Рабочее время успешно добавлено", workingHour });
  } catch (err) {
    logger.error(
      `Ошибка при добавлении рабочего времени ID: ${targetEmployeeId}`,
      { error: err }
    );
    next(err);
  }
};

// Получение рабочего расписания сотрудника (личный)
export const getWorkingHours = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = req.user.id;
    const workingHours = await knex<WorkingHours>(WH_TABLE)
      .select(
        "id",
        "employee_id",
        "day_of_week",
        "specific_date",
        "start_time",
        "end_time"
      )
      .where({ employee_id: employeeId });

    logDebug(`Получено расписание для сотрудника ID: ${employeeId}`, {
      workingHours,
    });
    res.status(200).json(workingHours);
  } catch (err) {
    logger.error(
      `Ошибка при получении рабочего расписания для сотрудника ID: ${req.user.id}`,
      { error: err }
    );
    next(err);
  }
};

// Получение рабочего расписания по ID (публичный)
export const getEmployeeScheduleByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const workingHours = await knex<WorkingHours>(WH_TABLE)
      .select(
        "id",
        "employee_id",
        "day_of_week",
        "specific_date",
        "start_time",
        "end_time"
      )
      .where({ employee_id: employeeId });

    logDebug(`Public fetch schedule for employee ID: ${employeeId}`, {
      workingHours,
    });
    res.status(200).json(workingHours);
  } catch (err) {
    logger.error(
      `Ошибка при публичном получении расписания для сотрудника ID: ${req.params.id}`,
      { error: err }
    );
    next(err);
  }
};

// Обновление рабочего времени
export const updateWorkingHours = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация
  const { error, value } = workingHoursSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d: ValidationErrorItem) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  try {
    const workingHourId = parseInt(req.params.id, 10);
    const record = await knex<WorkingHours>(WH_TABLE)
      .where({ id: workingHourId })
      .first();
    if (!record) {
      res.status(404).json({ message: "Рабочее время не найдено" });
      return;
    }
    if (req.user.role === "employee" && record.employee_id !== req.user.id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await knex<WorkingHours>(WH_TABLE).where({ id: workingHourId }).update({
      day_of_week: value.day_of_week,
      specific_date: value.specific_date,
      start_time: value.start_time,
      end_time: value.end_time,
    });

    const updated = await knex<WorkingHours>(WH_TABLE)
      .where({ id: workingHourId })
      .first();
    if (!updated) {
      res.status(404).json({ message: "Обновленное время не найдено" });
      return;
    }

    logDebug(`Обновлено рабочее время ID: ${workingHourId}`, { updated });
    res
      .status(200)
      .json({ message: "Рабочее время успешно обновлено", updated });
  } catch (err) {
    logger.error(
      `Ошибка при обновлении рабочего времени ID: ${req.params.id}`,
      {
        error: err,
      }
    );
    next(err);
  }
};

// Удаление рабочего времени
export const deleteWorkingHours = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workingHourId = parseInt(req.params.id, 10);
    const record = await knex<WorkingHours>(WH_TABLE)
      .where({ id: workingHourId })
      .first();
    if (!record) {
      res.status(404).json({ message: "Рабочее время не найдено" });
      return;
    }
    if (req.user.role === "employee" && record.employee_id !== req.user.id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await knex<WorkingHours>(WH_TABLE).where({ id: workingHourId }).del();

    logDebug(`Удалено рабочее время ID: ${workingHourId}`);
    res.status(200).json({ message: "Рабочее время успешно удалено" });
  } catch (err) {
    logger.error(`Ошибка при удалении рабочего времени ID: ${req.params.id}`, {
      error: err,
    });
    next(err);
  }
};
