import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { WorkingHours } from "../interfaces/model";
import logger from "../utils/logger";
import { AuthRequest } from "../middleware/authMiddleware";
import Joi from "joi";

// Константы для таблицы и алиаса
const WH_TABLE = "WorkingHours";
const WH_ALIAS = "w";
const TABLE_REF = `${WH_TABLE} as ${WH_ALIAS}`;

// Условное debug-логирование
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схема валидации рабочего времени
const workingHoursSchema = Joi.object({
  employee_id: Joi.number().integer(),
  day_of_week: Joi.number().integer().min(0).max(6).when("specific_date", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  specific_date: Joi.date().iso().allow(null).when("day_of_week", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .message("start_time must be in HH:mm format"),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .message("end_time must be in HH:mm format"),
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
    const details = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Invalid payload", details });
  }

  // Определяем targetEmployeeId
  let targetEmployeeId: number;
  if (req.user.role === "super_admin" || req.user.role === "local_admin") {
    if (!value.employee_id) {
      return res
        .status(400)
        .json({ message: "employee_id is required for admins" });
    }
    targetEmployeeId = value.employee_id;
  } else if (req.user.role === "employee") {
    targetEmployeeId = req.user.id;
  } else {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    logDebug(
      `Добавление рабочего времени для сотрудника ID: ${targetEmployeeId}`,
      { value }
    );
    const [workingHour] = await knex<WorkingHours>(TABLE_REF)
      .insert({
        employee_id: targetEmployeeId,
        day_of_week: value.day_of_week,
        specific_date: value.specific_date,
        start_time: value.start_time,
        end_time: value.end_time,
      })
      .returning([
        `${WH_ALIAS}.id`,
        `${WH_ALIAS}.employee_id`,
        `${WH_ALIAS}.day_of_week`,
        `${WH_ALIAS}.specific_date`,
        `${WH_ALIAS}.start_time`,
        `${WH_ALIAS}.end_time`,
      ]);

    logDebug(
      `Рабочее время добавлено (ID: ${workingHour.id}) для сотрудника ID: ${targetEmployeeId}`,
      { workingHour }
    );
    return res
      .status(201)
      .json({ message: "Рабочее время успешно добавлено", workingHour });
  } catch (err) {
    logger.error(
      `Error adding working hours for employee ID: ${targetEmployeeId}`,
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
    const workingHours = await knex<WorkingHours>(TABLE_REF)
      .select(
        `${WH_ALIAS}.id`,
        `${WH_ALIAS}.employee_id`,
        `${WH_ALIAS}.day_of_week`,
        `${WH_ALIAS}.specific_date`,
        `${WH_ALIAS}.start_time`,
        `${WH_ALIAS}.end_time`
      )
      .where(`${WH_ALIAS}.employee_id`, employeeId);

    logDebug(`Получено расписание для сотрудника ID: ${employeeId}`, {
      workingHours,
    });
    return res.status(200).json(workingHours);
  } catch (err) {
    logger.error(
      `Error fetching working hours for employee ID: ${req.user.id}`,
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
    const workingHours = await knex<WorkingHours>(TABLE_REF)
      .select(
        `${WH_ALIAS}.id`,
        `${WH_ALIAS}.employee_id`,
        `${WH_ALIAS}.day_of_week`,
        `${WH_ALIAS}.specific_date`,
        `${WH_ALIAS}.start_time`,
        `${WH_ALIAS}.end_time`
      )
      .where(`${WH_ALIAS}.employee_id`, employeeId);

    logDebug(`Public fetch schedule for employee ID: ${employeeId}`, {
      workingHours,
    });
    return res.status(200).json(workingHours);
  } catch (err) {
    logger.error(
      `Error public fetching schedule for employee ID: ${req.params.id}`,
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
    const details = error.details.map((d) => d.message);
    return res.status(400).json({ message: "Invalid payload", details });
  }

  try {
    const workingHourId = parseInt(req.params.id, 10);
    const record = await knex<WorkingHours>(TABLE_REF)
      .where("w.id", workingHourId)
      .first();
    if (!record) {
      return res.status(404).json({ message: "Рабочее время не найдено" });
    }
    // Проверка прав
    if (req.user.role === "employee" && record.employee_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await knex<WorkingHours>(TABLE_REF).where("w.id", workingHourId).update({
      day_of_week: value.day_of_week,
      specific_date: value.specific_date,
      start_time: value.start_time,
      end_time: value.end_time,
    });

    const updated = await knex<WorkingHours>(TABLE_REF)
      .where("w.id", workingHourId)
      .first();
    if (!updated) {
      return res.status(404).json({ message: "Обновленное время не найдено" });
    }

    logDebug(`Обновлено рабочее время ID: ${workingHourId}`, { updated });
    return res
      .status(200)
      .json({ message: "Рабочее время успешно обновлено", updated });
  } catch (err) {
    logger.error(`Error updating working hours ID: ${req.params.id}`, {
      error: err,
    });
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
    const record = await knex<WorkingHours>(TABLE_REF)
      .where("w.id", workingHourId)
      .first();
    if (!record) {
      return res.status(404).json({ message: "Рабочее время не найдено" });
    }
    if (req.user.role === "employee" && record.employee_id !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await knex<WorkingHours>(TABLE_REF).where("w.id", workingHourId).del();

    logDebug(`Удалено рабочее время ID: ${workingHourId}`);
    return res.status(200).json({ message: "Рабочее время успешно удалено" });
  } catch (err) {
    logger.error(`Error deleting working hours ID: ${req.params.id}`, {
      error: err,
    });
    next(err);
  }
};
