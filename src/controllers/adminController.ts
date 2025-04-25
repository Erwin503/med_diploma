import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";
import Joi from "joi";
import { User, EmployeeDetails } from "../interfaces/model";

// Константы
const USERS_TABLE = "Users";
const EMP_DETAILS_TABLE = "EmployeeDetails";

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
  district_id: Joi.number().integer().optional(),
  specialization: Joi.string().optional(),
  experience_years: Joi.number().integer().min(0).optional(),
  bio: Joi.string().optional(),
  certifications: Joi.string().optional(),
});

// Получение списка пользователей
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { error, value } = listUsersSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid query", details });
    return;
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

// Получение пользователя по ID
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const user = await knex(USERS_TABLE)
      .select("id", "name", "email", "phone", "role")
      .where({ id: userId })
      .first();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    logDebug("Fetched user by ID", { userId });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// Обновление пользователя
export const updateUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { error, value } = updateUserSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const exists = await knex(USERS_TABLE).where({ id: userId }).first();
    if (!exists) {
      res.status(404).json({ message: "User not found" });
      return;
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

// Удаление пользователя
export const deleteUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const exists = await knex(USERS_TABLE).where({ id: userId }).first();
    if (!exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await knex(USERS_TABLE).where({ id: userId }).del();

    logDebug("Deleted user by admin", { userId });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// Назначение роли и автоматическое создание/обновление EmployeeDetails
export const assignRoleToUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const { error, value } = assignRoleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  const {
    email,
    role,
    district_id,
    specialization,
    experience_years,
    bio,
    certifications,
  } = value;

  try {
    await knex.transaction(async (trx) => {
      // 1. Найти пользователя
      const user = await trx<User>(USERS_TABLE).where({ email }).first();
      if (!user) {
        res.status(404).json({ message: "User not found" });
        throw new Error("rollback");
      }

      // 2. Проверить права назначения
      if (role === "local_admin" && req.user.role !== "super_admin") {
        res.status(403).json({ message: "Not allowed to assign local_admin" });
        throw new Error("rollback");
      }
      if (role === "super_admin" && req.user.role !== "super_admin") {
        res.status(403).json({ message: "Not allowed to assign super_admin" });
        throw new Error("rollback");
      }

      // 3. Обновить роль
      await trx(USERS_TABLE)
        .where({ email })
        .update({ role, updated_at: trx.fn.now() });

      // 4. Если employee — создать/обновить EmployeeDetails
      if (role === "employee") {
        // Определить department
        let targetDistrictId: number;
        if (req.user.role === "super_admin") {
          // супер-админ передаёт district_id
          if (!district_id) {
            res
              .status(400)
              .json({ message: "district_id is required for super_admin" });
            throw new Error("rollback");
          }
          // проверить существование отдела
          const d = await trx("Districts").where({ id: district_id }).first();
          if (!d) {
            res.status(404).json({ message: "District not found" });
            throw new Error("rollback");
          }
          targetDistrictId = district_id;
        } else {
          // local_admin берёт свой district_id из своей записи
          const adminDet = await trx<EmployeeDetails>(EMP_DETAILS_TABLE)
            .where({ user_id: req.user.id })
            .first();
          if (!adminDet) {
            res
              .status(403)
              .json({ message: "Local admin has no department assigned" });
            throw new Error("rollback");
          }
          targetDistrictId = adminDet.district_id;
        }

        // payload для EmployeeDetails
        const detailsPayload = {
          user_id: user.id,
          district_id: targetDistrictId,
          specialization: specialization || null,
          experience_years: experience_years || null,
          bio: bio || null,
          certifications: certifications || null,
        };

        const existing = await trx<EmployeeDetails>(EMP_DETAILS_TABLE)
          .where({ user_id: user.id })
          .first();

        if (existing) {
          await trx(EMP_DETAILS_TABLE)
            .where({ user_id: user.id })
            .update(detailsPayload);
        } else {
          await trx(EMP_DETAILS_TABLE).insert(detailsPayload);
        }
      }

      res.status(200).json({ message: `Role ${role} assigned to ${email}` });
      // Транзакция закоммитится автоматически
    });
  } catch (err) {
    if ((err as Error).message !== "rollback") {
      logger.error("Error in assignRoleToUser", { error: err });
      next(err);
    }
    // Если rollback — ответ уже отправлен
  }
};
