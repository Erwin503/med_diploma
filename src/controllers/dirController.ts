import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi from "joi";
import { Direction, Category, EmployeeDetails } from "../interfaces/model";

const DIRECTIONS_TABLE = "Directions";
const CATEGORIES_TABLE = "Categories";
const EMP_DETAILS_TABLE = "EmployeeDetails";

const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Joi‐схема для Direction
const directionSchema = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().allow("", null).optional(),
  requirements: Joi.string().allow("", null).optional(),
  category_id: Joi.number().integer().required(),
});

// Создать направление
export const addDirection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const { error, value } = directionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    res.status(400).json({
      message: "Invalid payload",
      details: error.details.map((d) => d.message),
    });
  }
  try {
    // Проверка существования категории
    const category = await knex<Category>(CATEGORIES_TABLE)
      .where({ id: value.category_id })
      .first();
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Проверка прав local_admin по district_id
    if (req.user.role === "local_admin") {
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet || adminDet.district_id !== category.district_id) {
        res
          .status(403)
          .json({ message: "Not allowed to create in this category" });
      }
    }

    // Вставка
    const [insertId] = await knex<Direction>(DIRECTIONS_TABLE).insert({
      name: value.name,
      description: value.description,
      requirements: value.requirements,
      category_id: value.category_id,
    });
    const direction = await knex<Direction>(DIRECTIONS_TABLE)
      .select("id", "name", "description", "requirements", "category_id")
      .where({ id: insertId })
      .first();

    logDebug("Created direction", { direction });
    res.status(201).json({ message: "Direction created", direction });
  } catch (err) {
    logger.error("Error creating direction", { error: err });
    next(err);
  }
};

// Получить все направления (публично)
export const getAllDirections = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const directions = await knex<Direction>(DIRECTIONS_TABLE).select(
      "id",
      "name",
      "description",
      "requirements",
      "category_id"
    );
    res.status(200).json(directions);
  } catch (err) {
    logger.error("Error fetching directions", { error: err });
    next(err);
  }
};

// Получить направление по ID (публично)
export const getDirectionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const direction = await knex<Direction>(DIRECTIONS_TABLE)
      .select("id", "name", "description", "requirements", "category_id")
      .where({ id })
      .first();
    if (!direction) {
      res.status(404).json({ message: "Direction not found" });
    }
    res.status(200).json(direction);
  } catch (err) {
    logger.error("Error fetching direction by ID", { error: err });
    next(err);
  }
};

// Обновить направление
export const updateDirection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }
  const { error, value } = directionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    res.status(400).json({
      message: "Invalid payload",
      details: error.details.map((d) => d.message),
    });
  }
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await knex<Direction>(DIRECTIONS_TABLE)
      .where({ id })
      .first();
    if (!existing) {
      res.status(404).json({ message: "Direction not found" });
    }

    // Проверяем категорию и права local_admin
    const category = await knex<Category>(CATEGORIES_TABLE)
      .where({ id: value.category_id })
      .first();
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    if (req.user.role === "local_admin") {
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet || adminDet.district_id !== category.district_id) {
        res
          .status(403)
          .json({ message: "Not allowed to update this direction" });
      }
    }

    await knex<Direction>(DIRECTIONS_TABLE).where({ id }).update({
      name: value.name,
      description: value.description,
      requirements: value.requirements,
      category_id: value.category_id,
    });

    const updated = await knex<Direction>(DIRECTIONS_TABLE)
      .select("id", "name", "description", "requirements", "category_id")
      .where({ id })
      .first();

    logDebug("Updated direction", { updated });
    res.status(200).json({ message: "Direction updated", updated });
  } catch (err) {
    logger.error("Error updating direction", { error: err });
    next(err);
  }
};

// Удалить направление
export const deleteDirection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await knex<Direction>(DIRECTIONS_TABLE)
      .where({ id })
      .first();
    if (!existing) {
      res.status(404).json({ message: "Direction not found" });
      return;
    }

    // Проверяем права local_admin
    if (req.user.role === "local_admin") {
      const category = await knex<Category>(CATEGORIES_TABLE)
        .where({ id: existing.category_id })
        .first();
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet || adminDet.district_id !== category?.district_id) {
        res
          .status(403)
          .json({ message: "Not allowed to delete this direction" });
      }
    }

    await knex<Direction>(DIRECTIONS_TABLE).where({ id }).del();

    logDebug("Deleted direction", { id });
    res.status(200).json({ message: "Direction deleted" });
  } catch (err) {
    logger.error("Error deleting direction", { error: err });
    next(err);
  }
};
