import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { District } from "../interfaces/model";
import logger from "../utils/logger";
import Joi from "joi";
import { AuthRequest } from "../middleware/authMiddleware";

// Константы для таблицы и алиаса
const DIST_TABLE = "Districts";
const DIST_ALIAS = "d";
const TABLE_REF = `${DIST_TABLE} as ${DIST_ALIAS}`;

// Условное debug-логирование
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схема валидации данных отдела
const districtSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

// Добавление нового отдела (только super_admin)
export const addDistrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.role !== "super_admin") {
    res.status(403).json({ message: "Доступ запрещен" });
  }

  // Валидация тела запроса
  const { error, value } = districtSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details: messages });
  }

  try {
    const { name, address, phone, email } = value;
    const [district] = await knex<District>(TABLE_REF)
      .insert({ name, address, phone, email })
      .returning(["id", "name", "address", "phone", "email"]);

    logDebug(`Добавлен новый отдел с id: ${district.id}`, { district });
    res.status(201).json({ message: "Отдел успешно добавлен", district });
  } catch (err) {
    next(err);
  }
};

// Получение всех отделов (доступно всем)
export const getAllDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const districts = await knex<District>(TABLE_REF).select(
      `${DIST_ALIAS}.id`,
      `${DIST_ALIAS}.name`,
      `${DIST_ALIAS}.address`,
      `${DIST_ALIAS}.phone`,
      `${DIST_ALIAS}.email`
    );

    logDebug(
      `Запрос всех отделов: [${districts.map((d) => d.id).join(", ")}]`,
      { count: districts.length }
    );
    res.status(200).json(districts);
  } catch (err) {
    next(err);
  }
};

// Получение одного отдела по ID (доступно всем)
export const getDistrictById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const district = await knex<District>(TABLE_REF)
      .select(
        `${DIST_ALIAS}.id`,
        `${DIST_ALIAS}.name`,
        `${DIST_ALIAS}.address`,
        `${DIST_ALIAS}.phone`,
        `${DIST_ALIAS}.email`
      )
      .where(`${DIST_ALIAS}.id`, id)
      .first();

    if (!district) {
      res.status(404).json({ message: "Отдел не найден" });
    }

    logDebug(`Запрос отдела по id: ${district.id}`, { district });
    res.status(200).json(district);
  } catch (err) {
    next(err);
  }
};

// Обновление информации об отделе (только super_admin)
export const updateDistrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.role !== "super_admin") {
    res.status(403).json({ message: "Доступ запрещен" });
  }

  // Валидация тела запроса
  const { error, value } = districtSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details: messages });
  }

  try {
    const id = parseInt(req.params.id, 10);
    const { name, address, phone, email } = value;

    const updatedCount = await knex<District>(TABLE_REF)
      .where(`${DIST_ALIAS}.id`, id)
      .update({ name, address, phone, email });

    if (!updatedCount) {
      res.status(404).json({ message: "Отдел не найден" });
    }

    const updatedDistrict = await knex<District>(TABLE_REF)
      .select(
        `${DIST_ALIAS}.id`,
        `${DIST_ALIAS}.name`,
        `${DIST_ALIAS}.address`,
        `${DIST_ALIAS}.phone`,
        `${DIST_ALIAS}.email`
      )
      .where(`${DIST_ALIAS}.id`, id)
      .first();

    // Явная обработка undefined после .first()
    if (!updatedDistrict) {
      res.status(404).json({ message: "Обновленный отдел не найден" });
    }

    logDebug(`Обновлен отдел по id: ${updatedDistrict.id}`, {
      updatedDistrict,
    });
    res
      .status(200)
      .json({ message: "Отдел успешно обновлен", updatedDistrict });
  } catch (err) {
    next(err);
  }
};

// Удаление отдела (только super_admin)
export const deleteDistrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.role !== "super_admin") {
    res.status(403).json({ message: "Доступ запрещен" });
  }

  try {
    const id = parseInt(req.params.id, 10);
    const deletedCount = await knex<District>(TABLE_REF)
      .where(`${DIST_ALIAS}.id`, id)
      .del();

    if (!deletedCount) {
      res.status(404).json({ message: "Отдел не найден" });
    }

    logDebug(`Удалён отдел по id: ${id}`);
    res.status(200).json({ message: "Отдел успешно удалён" });
  } catch (err) {
    next(err);
  }
};
