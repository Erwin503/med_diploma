import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi from "joi";
import { Category, EmployeeDetails } from "../interfaces/model";

const CATEGORIES_TABLE = "Categories";
const EMP_DETAILS_TABLE = "EmployeeDetails";

const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Joi-схема для Category
const categorySchema = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().allow("", null).optional(),
  district_id: Joi.number().integer().optional(),
});

// Создать категорию
export const addCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Все могут посмотреть, а для создания нужны права
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { error, value } = categorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  try {
    // Определяем district_id для записи
    let targetDistrictId: number;
    if (req.user.role === "super_admin") {
      if (!value.district_id) {
        res.status(400).json({ message: "district_id is required" });
        return;
      }
      targetDistrictId = value.district_id;
    } else {
      // local_admin: берём свой district_id из EmployeeDetails
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet) {
        res
          .status(403)
          .json({ message: "Local admin has no department assigned" });
        return;
      }
      targetDistrictId = adminDet.district_id;
    }

    // Проверяем существование отдела
    const district = await knex("Districts")
      .where({ id: targetDistrictId })
      .first();
    if (!district) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    // Вставка
    const [insertId] = await knex<Category>(CATEGORIES_TABLE).insert({
      name: value.name,
      description: value.description,
      district_id: targetDistrictId,
    });
    const category = await knex<Category>(CATEGORIES_TABLE)
      .select("id", "name", "description", "district_id")
      .where({ id: insertId })
      .first();

    logDebug("Created category", { category });
    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    logger.error("Error creating category", { error: err });
    next(err);
  }
};

// Получить все категории (публично)
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await knex<Category>(CATEGORIES_TABLE).select(
      "id",
      "name",
      "description",
      "district_id"
    );
    res.status(200).json(categories);
  } catch (err) {
    logger.error("Error fetching categories", { error: err });
    next(err);
  }
};

// Получить категорию по ID (публично)
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = await knex<Category>(CATEGORIES_TABLE)
      .select("id", "name", "description", "district_id")
      .where({ id })
      .first();
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(200).json(category);
  } catch (err) {
    logger.error("Error fetching category by ID", { error: err });
    next(err);
  }
};

// Обновить категорию
export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { error, value } = categorySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  try {
    const id = parseInt(req.params.id, 10);
    const existing = await knex<Category>(CATEGORIES_TABLE)
      .where({ id })
      .first();
    if (!existing) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Проверяем права по district_id
    let targetDistrictId = existing.district_id;
    if (req.user.role === "super_admin") {
      if (value.district_id) {
        // проверяем новую связь
        const d = await knex("Districts")
          .where({ id: value.district_id })
          .first();
        if (!d) {
          res.status(404).json({ message: "Department not found" });
          return;
        }
        targetDistrictId = value.district_id;
      }
    } else {
      // local_admin может менять только свои
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet || adminDet.district_id !== existing.district_id) {
        res.status(403).json({ message: "Not allowed to update this category" });
        return;
      }
    }

    // Обновляем
    await knex<Category>(CATEGORIES_TABLE)
      .where({ id })
      .update({
        name: value.name,
        description: value.description,
        district_id: targetDistrictId,
      });

    const updated = await knex<Category>(CATEGORIES_TABLE)
      .select("id", "name", "description", "district_id")
      .where({ id })
      .first();

    logDebug("Updated category", { updated });
    res.status(200).json({ message: "Category updated", updated });
  } catch (err) {
    logger.error("Error updating category", { error: err });
    next(err);
  }
};

// Удалить категорию
export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    const id = parseInt(req.params.id, 10);
    const existing = await knex<Category>(CATEGORIES_TABLE)
      .where({ id })
      .first();
    if (!existing) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Проверка прав
    if (req.user.role === "local_admin") {
      const adminDet = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
        .where({ user_id: req.user.id })
        .first();
      if (!adminDet || adminDet.district_id !== existing.district_id) {
        res.status(403).json({ message: "Not allowed to delete this category" });
        return;
      }
    }

    await knex<Category>(CATEGORIES_TABLE).where({ id }).del();

    logDebug("Deleted category", { id });
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    logger.error("Error deleting category", { error: err });
    next(err);
  }
};
