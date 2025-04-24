import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi from "joi";

// Константы
const USERS_TABLE = "Users";
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схемы валидации
const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
  role: Joi.string()
    .valid("user", "employee", "local_admin", "super_admin")
    .optional(),
});
const updateUserSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
}).min(1);
const assignRoleSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid("user", "employee", "local_admin", "super_admin")
    .required(),
});

// Получение списка пользователей (только local_admin и super_admin)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  const { error, value } = listUsersSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid query", details });
  }

  try {
    const { page, limit, role } = value;
    const offset = (page - 1) * limit;

    const query = knex(USERS_TABLE).select(
      "id",
      "name",
      "email",
      "phone",
      "role"
    );
    if (role) query.where({ role });

    const users = await query.offset(offset).limit(limit);

    const totalObj = await knex(USERS_TABLE)
      .count("* as total")
      .modify((qb) => {
        if (role) qb.where({ role });
      })
      .first();
    const total = Number(totalObj?.total || 0);

    logDebug("Fetched users list", { count: users.length, total });
    res.status(200).json({ users, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

// Получение пользователя по ID (только local_admin и super_admin)
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const user = await knex(USERS_TABLE)
      .select("id", "name", "email", "phone", "role")
      .where({ id: userId })
      .first();

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    logDebug("Fetched user by ID", { userId });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// Обновление пользователя (только local_admin и super_admin)
export const updateUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  const { error, value } = updateUserSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const exists = await knex(USERS_TABLE).where({ id: userId }).first();
    if (!exists) {
      res.status(404).json({ message: "User not found" });
    }

    await knex(USERS_TABLE)
      .where({ id: userId })
      .update({ ...value, updated_at: new Date() });

    logDebug("Updated user by admin", { userId, ...value });
    res.status(200).json({ message: "User updated" });
  } catch (err) {
    next(err);
  }
};

// Удаление пользователя (только local_admin и super_admin)
export const deleteUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const exists = await knex(USERS_TABLE).where({ id: userId }).first();
    if (!exists) {
      res.status(404).json({ message: "User not found" });
    }

    await knex(USERS_TABLE).where({ id: userId }).del();

    logDebug("Deleted user by admin", { userId });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// Назначение роли пользователю (с ограничениями)
export const assignRoleToUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  const { error, value } = assignRoleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
  }

  try {
    const { email, role } = value;
    const user = await knex(USERS_TABLE).where({ email }).first();
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    // Проверка прав назначения ролей
    if (
      role === "employee" &&
      !["super_admin", "local_admin"].includes(req.user.role)
    ) {
      res.status(403).json({ message: "Not allowed to assign employee" });
    }
    if (role === "local_admin" && req.user.role !== "super_admin") {
      res.status(403).json({ message: "Not allowed to assign local_admin" });
    }
    if (role === "super_admin" && req.user.role !== "super_admin") {
      res.status(403).json({ message: "Not allowed to assign super_admin" });
    }

    if (user.role === role) {
      res.status(200).json({ message: `Role already ${role}` });
    }

    await knex(USERS_TABLE)
      .where({ email })
      .update({ role, updated_at: new Date() });

    logDebug("Assigned role by admin", { email, role });
    res.status(200).json({ message: `Role ${role} assigned` });
  } catch (err) {
    next(err);
  }
};
