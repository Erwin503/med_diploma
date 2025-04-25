// src/controllers/statisticsController.ts
import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import logger from "../utils/logger";

export const getAttendanceByDirection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Проверяем права
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
    // Прерываем дальнейшее выполнение, передав управление в Express
    next();
    return;
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1) Получаем список всех направлений
    const allDirections: Array<{ id: number; name: string }> = await knex(
      "Directions"
    ).select("id", "name");

    logger.debug(`directions - ${JSON.stringify(allDirections)}`);

    // 2) Подсчёт completed за последнюю неделю
    const rows = await knex("Sessions as s")
      .join("Directions as d", "s.direction_id", "d.id")
      .where("s.status", "completed")
      .andWhere("s.updated_at", ">=", sevenDaysAgo)
      .groupBy("d.id", "d.name")
      .select("d.name")
      .count("s.id as count");
    logger.debug(`rows - ${JSON.stringify(rows)}`);

    // 3) Формируем результат, инициализируя 0
    const result: Record<string, number> = {};
    allDirections.forEach(({ name }) => {
      result[name] = 0;
    });
    logger.debug(`JSON.stringify(rows) - ${JSON.stringify(rows)}`);

    // 4) Подставляем реальные значения
    rows.forEach(({ name, count }) => {
      // count может быть строкой (MySQL возвращает string) или числом
      const num = typeof count === "string" ? parseInt(count, 10) : count;
      result[name] = num;
    });

    res.status(200).json(result);
    next(); // передаём управление дальше (если есть)
  } catch (err) {
    logger.error("Error fetching attendance stats", { error: err });
    next(err);
  }
};
