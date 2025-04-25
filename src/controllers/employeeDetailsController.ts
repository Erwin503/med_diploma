import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { EmployeeDetails, User } from "../interfaces/model";
import logger from "../utils/logger";
import { AuthRequest } from "../middleware/authMiddleware";
import Joi from "joi";

// Таблицы и алиасы
const USERS_TABLE = "Users";
const EMP_DETAILS_TABLE = "EmployeeDetails";
const EMP_ALIAS = "e";
const TABLE_EMP = `${EMP_DETAILS_TABLE} as ${EMP_ALIAS}`;

// Условное debug-логирование
const isDev = process.env.NODE_ENV === "development";
const logDebug = (msg: string, meta?: any) => {
  if (isDev) logger.debug(msg, meta);
};

// Схема валидации
const employeeDetailsSchema = Joi.object({
  user_id: Joi.number().integer(),
  district_id: Joi.number().integer().required(),
  specialization: Joi.string().optional(),
  experience_years: Joi.number().integer().min(0).optional(),
  bio: Joi.string().optional(),
  certifications: Joi.string().optional(),
});

// Добавление информации о сотруднике
export const addEmployeeDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Валидация тела
  const { error, value } = employeeDetailsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  // Определяем, для какого user_id и какой department_id
  let targetUserId: number;
  let targetDistrictId: number;

  if (req.user.role === "super_admin") {
    // супер-админ берёт и user_id и district_id из тела
    targetUserId = value.user_id!;
    targetDistrictId = value.district_id;
  } else if (req.user.role === "local_admin") {
    // локальный админ берёт user_id из body, но district_id из своих деталей
    targetUserId = value.user_id!;
    const adminDetail = await knex<EmployeeDetails>(TABLE_EMP)
      .where(`${EMP_ALIAS}.user_id`, req.user.id)
      .first();
    if (!adminDetail) {
      res.status(403).json({ message: "Local admin has no assigned department" });
      return;
    }
    targetDistrictId = adminDetail.district_id;
  } else if (req.user.role === "employee") {
    // сотрудник может добавить только себе
    targetUserId = req.user.id;
    targetDistrictId = value.district_id;
  } else {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  try {
    logDebug(`Checking district existence: ${targetDistrictId}`);
    const districtExists = await knex("Districts")
      .where({ id: targetDistrictId })
      .first();
    if (!districtExists) {
      res.status(404).json({ message: "District not found" });
      return;
    }

    logDebug(`Adding details for user ${targetUserId} in district ${targetDistrictId}`, { value });
    const [details] = await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
      .insert({
        user_id: targetUserId,
        district_id: targetDistrictId,
        specialization: value.specialization,
        experience_years: value.experience_years,
        bio: value.bio,
        certifications: value.certifications,
      })
      .returning("*");

    logDebug(`EmployeeDetails added: ${details.id}`, { details });
    res.status(201).json({ message: "Employee details added", details });
  } catch (err) {
    logger.error("Error adding employee details", { error: err });
    next(err);
  }
};

// Получение деталей сотрудника (личные)
export const getEmployeeDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const targetId = req.user.id;
    const details = await knex<EmployeeDetails>(TABLE_EMP)
      .select(
        `${EMP_ALIAS}.specialization`,
        `${EMP_ALIAS}.experience_years`,
        `${EMP_ALIAS}.bio`,
        `${EMP_ALIAS}.certifications`
      )
      .where(`${EMP_ALIAS}.user_id`, targetId)
      .first();

    if (!details) {
      res.status(404).json({ message: "Employee details not found" });
      return;
    }

    res.status(200).json(details);
  } catch (err) {
    logger.error("Error fetching employee details", { error: err });
    next(err);
  }
};

// Публичное получение деталей по ID
export const getEmployeeDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const details = await knex<EmployeeDetails>(TABLE_EMP)
      .select(
        `${EMP_ALIAS}.specialization`,
        `${EMP_ALIAS}.experience_years`,
        `${EMP_ALIAS}.bio`,
        `${EMP_ALIAS}.certifications`,
        `${EMP_ALIAS}.photo_url`
      )
      .where(`${EMP_ALIAS}.user_id`, targetId)
      .first();

    if (!details) {
      res.status(404).json({ message: "Employee details not found" });
      return;
    }

    res.status(200).json(details);
  } catch (err) {
    logger.error("Error fetching employee details by ID", { error: err });
    next(err);
  }
};

// Обновление деталей (сотрудник может обновить свои, админы любые)
export const updateEmployeeDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = employeeDetailsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message);
    res.status(400).json({ message: "Invalid payload", details });
    return;
  }

  try {
    const targetId =
      req.user.role === "employee" ? req.user.id : parseInt(req.params.id, 10);
    const record = await knex<EmployeeDetails>(TABLE_EMP)
      .where(`${EMP_ALIAS}.user_id`, targetId)
      .first();
    if (!record) {
      res.status(404).json({ message: "Employee details not found" });
      return;
    }
    if (req.user.role === "employee" && record.user_id !== req.user.id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
      .where("user_id", targetId)
      .update(value);

    const updated = await knex<EmployeeDetails>(TABLE_EMP)
      .where(`${EMP_ALIAS}.user_id`, targetId)
      .first();

    res.status(200).json({ message: "Employee details updated", updated });
  } catch (err) {
    logger.error("Error updating employee details", { error: err });
    next(err);
  }
};

// Удаление деталей (сотрудник свои или админы любые)
export const deleteEmployeeDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const targetId =
      req.user.role === "employee" ? req.user.id : parseInt(req.params.id, 10);
    const record = await knex<EmployeeDetails>(TABLE_EMP)
      .where(`${EMP_ALIAS}.user_id`, targetId)
      .first();
    if (!record) {
      res.status(404).json({ message: "Employee details not found" });
      return;
    }
    if (req.user.role === "employee" && record.user_id !== req.user.id) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await knex<EmployeeDetails>(EMP_DETAILS_TABLE)
      .where("user_id", targetId)
      .del();

    res.status(200).json({ message: "Employee details deleted" });
  } catch (err) {
    logger.error("Error deleting employee details", { error: err });
    next(err);
  }
};

// Получение списка всех сотрудников с деталями
export const getAllEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rows = await knex(USERS_TABLE + " as u")
      .leftJoin(EMP_DETAILS_TABLE + " as e", "u.id", "=", "e.user_id")
      .where("u.role", "employee")
      .select(
        "u.id as user_id",
        "u.name",
        "u.email",
        "e.specialization",
        "e.experience_years",
        "e.bio",
        "e.certifications"
      );

    const formatted = rows.map((r) => {
      const {
        user_id,
        name,
        email,
        specialization,
        experience_years,
        bio,
        certifications,
      } = r;
      const has = specialization || experience_years || bio || certifications;
      return has
        ? r
        : {
            user_id,
            name,
            email,
            message: "У этого сотрудника нет дополнительной информации",
          };
    });

    res.status(200).json(formatted);
  } catch (err) {
    logger.error("Error fetching all employees", { error: err });
    next(err);
  }
};
