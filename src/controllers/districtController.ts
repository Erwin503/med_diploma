import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { District } from "../interfaces/model";
import logger from "../utils/logger";

const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Добавление нового отдела
export const addDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, address, phone, email } = req.body;
    logDebug("Adding district", { name, address, phone, email });

    // В MySQL insert возвращает массив вставленных ID
    const [insertId] = await knex<District>("Districts")
      .insert({ name, address, phone, email });

    // Читаем созданный отдел
    const district = await knex<District>("Districts")
      .select("id", "name", "address", "phone", "email")
      .where({ id: insertId })
      .first();

    res.status(201).json({
      message: "Отдел успешно добавлен",
      district,
    });
  } catch (error) {
    logger.error("Ошибка при добавлении отдела", { error });
    next(error);
  }
};

// Получение всех отделов
export const getAllDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const districts = await knex<District>("Districts")
      .select("id", "name", "address", "phone", "email");
    logDebug("Fetched all districts", { count: districts.length });
    res.status(200).json(districts);
  } catch (error) {
    logger.error("Ошибка при получении всех отделов", { error });
    next(error);
  }
};

// Получение одного отдела по ID
export const getDistrictById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const district = await knex<District>("Districts")
      .select("id", "name", "address", "phone", "email")
      .where({ id })
      .first();

    if (!district) {
      res.status(404).json({ message: "Отдел не найден" });
      return;
    }

    logDebug("Fetched district by ID", { id });
    res.status(200).json(district);
  } catch (error) {
    logger.error("Ошибка при получении отдела по ID", { error });
    next(error);
  }
};

// Обновление информации об отделе
export const updateDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, address, phone, email } = req.body;
    logDebug("Updating district", { id, name, address, phone, email });

    const updatedCount = await knex<District>("Districts")
      .where({ id })
      .update({ name, address, phone, email });

    if (!updatedCount) {
      res.status(404).json({ message: "Отдел не найден" });
      return;
    }

    const updatedDistrict = await knex<District>("Districts")
      .select("id", "name", "address", "phone", "email")
      .where({ id })
      .first();

    res.status(200).json({
      message: "Отдел успешно обновлен",
      updatedDistrict,
    });
  } catch (error) {
    logger.error("Ошибка при обновлении отдела", { error });
    next(error);
  }
};

// Удаление отдела
export const deleteDistrict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    logDebug("Deleting district", { id });

    const deletedCount = await knex<District>("Districts")
      .where({ id })
      .del();

    if (!deletedCount) {
      res.status(404).json({ message: "Отдел не найден" });
      return;
    }

    res.status(200).json({ message: "Отдел успешно удален" });
  } catch (error) {
    logger.error("Ошибка при удалении отдела", { error });
    next(error);
  }
};
