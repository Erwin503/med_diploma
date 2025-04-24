import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { WorkingHours } from "../interfaces/model";
import logger from "../utils/logger";
import { AuthRequest } from "../middleware/authMiddleware";
import Joi from "joi";

// Настройка констант для таблицы и алиаса
const WH_TABLE = "WorkingHours";
const WH_ALIAS = "w";
const TABLE_REF = `${WH_TABLE} as ${WH_ALIAS}`;

// Определяем, в каком окружении работаем
const isDev = process.env.NODE_ENV === "development";
const logDebug = (message: string, meta?: any) => {
  if (isDev) logger.debug(message, meta);
};

// Схема валидации рабочего времени
// Схема валидации рабочего времени
const workingHoursSchema = Joi.object({
  employee_id: Joi.number().integer(),
  day_of_week: Joi.number()
    .integer()
    .min(0)
    .max(6)
    .optional(),
  specific_date: Joi.date()
    .iso()
    .allow(null)
    .optional(),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({ "string.pattern.base": "start_time must be in HH:mm format" }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({ "string.pattern.base": "end_time must be in HH:mm format" }),
})
  // Требуем хотя бы одно из полей: день недели или конкретная дата
  .or("day_of_week", "specific_date");


// Добавление рабочего времени сотрудника
export const addWorkingHours = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация тела запроса
  const { error, value } = workingHoursSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details: messages });
  }

  try {
    const employeeId = req.user.id;
    const { day_of_week, specific_date, start_time, end_time } = value;

    logDebug(`Добавление рабочего времени для сотрудника ID: ${employeeId}`, {
      data: value,
    });

    const [workingHour] = await knex<WorkingHours>(TABLE_REF)
      .insert({
        employee_id: employeeId,
        day_of_week,
        specific_date,
        start_time,
        end_time,
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
      `Рабочее время успешно добавлено для сотрудника ID: ${employeeId}`,
      { workingHour }
    );

    res
      .status(201)
      .json({ message: "Рабочее время успешно добавлено", workingHour });
  } catch (err) {
    logger.error(
      `Ошибка при добавлении рабочего времени для сотрудника ID: ${req.user.id}`,
      { error: err }
    );
    next(err);
  }
};

// Получение рабочего расписания сотрудника (собственный профиль)
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

    logDebug(`Рабочее расписание получено для сотрудника ID: ${employeeId}`, {
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

// Получение рабочего расписания сотрудника по ID (публичный доступ)
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

    logDebug(`Рабочее расписание получено для сотрудника ID: ${employeeId}`, {
      workingHours,
    });

    res.status(200).json(workingHours);
  } catch (err) {
    logger.error(
      `Ошибка при получении рабочего расписания по ID: ${req.params.id}`,
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
  // Валидация тела запроса
  const { error, value } = workingHoursSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details: messages });
  }

  try {
    const employeeId = req.user.id;
    const workingHourId = parseInt(req.params.id, 10);
    const { day_of_week, specific_date, start_time, end_time } = value;

    logDebug(
      `Обновление рабочего времени ID: ${workingHourId} для сотрудника ID: ${employeeId}`,
      { data: value }
    );

    // Проверка принадлежности записи сотруднику
    const record = await knex<WorkingHours>(TABLE_REF)
      .select(`${WH_ALIAS}.id`)
      .where({ id: workingHourId, employee_id: employeeId })
      .first();

    if (!record) {
      logDebug(
        `Рабочее время ID: ${workingHourId} не найдено для сотрудника ID: ${employeeId}`
      );
      res.status(404).json({ message: "Рабочее время не найдено" });
    }

    await knex<WorkingHours>(TABLE_REF)
      .where(`${WH_ALIAS}.id`, workingHourId)
      .update({ day_of_week, specific_date, start_time, end_time });

    const updated = await knex<WorkingHours>(TABLE_REF)
      .select(
        `${WH_ALIAS}.id`,
        `${WH_ALIAS}.employee_id`,
        `${WH_ALIAS}.day_of_week`,
        `${WH_ALIAS}.specific_date`,
        `${WH_ALIAS}.start_time`,
        `${WH_ALIAS}.end_time`
      )
      .where(`${WH_ALIAS}.id`, workingHourId)
      .first();

    // Явная обработка undefined после .first()
    if (!updated) {
      res.status(404).json({ message: "Обновленное рабочее время не найдено" });
    }

    logDebug(
      `Рабочее время ID: ${workingHourId} успешно обновлено для сотрудника ID: ${employeeId}`,
      { updated }
    );

    res
      .status(200)
      .json({ message: "Рабочее время успешно обновлено", updated });
  } catch (err) {
    logger.error(
      `Ошибка при обновлении рабочего времени ID: ${req.params.id} для сотрудника ID: ${req.user.id}`,
      { error: err }
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
    const employeeId = req.user.id;
    const workingHourId = parseInt(req.params.id, 10);

    logDebug(
      `Удаление рабочего времени ID: ${workingHourId} для сотрудника ID: ${employeeId}`
    );

    // Проверка принадлежности записи сотруднику
    const record = await knex<WorkingHours>(TABLE_REF)
      .select(`${WH_ALIAS}.id`)
      .where({ id: workingHourId, employee_id: employeeId })
      .first();

    if (!record) {
      logDebug(
        `Рабочее время ID: ${workingHourId} не найдено для сотрудника ID: ${employeeId}`
      );
      res.status(404).json({ message: "Рабочее время не найдено" });
    }

    await knex<WorkingHours>(TABLE_REF)
      .where(`${WH_ALIAS}.id`, workingHourId)
      .del();

    logDebug(
      `Рабочее время ID: ${workingHourId} успешно удалено для сотрудника ID: ${employeeId}`
    );

    res.status(200).json({ message: "Рабочее время успешно удалено" });
  } catch (err) {
    logger.error(
      `Ошибка при удалении рабочего времени ID: ${req.params.id} для сотрудника ID: ${req.user.id}`,
      { error: err }
    );
    next(err);
  }
};
