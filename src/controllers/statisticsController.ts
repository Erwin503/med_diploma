// src/controllers/statisticsController.ts
import { Request, Response, NextFunction } from "express";
import knex from "../db/knex";
import { AuthRequest } from "../middleware/authMiddleware";
import { SessionStatus } from "../enum/sessionEnum";
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

/**
 * Динамика отказов и отмен за последние N дней.
 * В query-параметре ?days= можно передать число дней (по умолчанию 30).
 */
export const getCancellationDynamics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  try {
    // Определяем период (по умолчанию 30 дней)
    const days = parseInt((req.query.days as string) || "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Группируем по дате обновления
    const rows = await knex("Sessions")
      .where("status", SessionStatus.CANCELED)
      .andWhere("updated_at", ">=", since)
      .groupByRaw("DATE(updated_at)")
      .select(
        knex.raw("DATE(updated_at) AS date"),
        knex.raw("COUNT(*) AS count")
      );

    // Превращаем MySQL-строки в числа
    const result = rows.map((r: any) => ({
      date: r.date,
      count: typeof r.count === "string" ? parseInt(r.count, 10) : r.count,
    }));

    res.status(200).json(result);
  } catch (err) {
    logger.error("Error fetching cancellation dynamics", { error: err });
    next(err);
  }
};

/**
 * Тепловая матрица загруженности по дням недели и часам начала рабочего интервала.
 * Возвращает массив записей вида { day_of_week: string, hour: number, count: number }.
 */
export const getLoadHeatmap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!["super_admin", "local_admin"].includes(req.user.role)) {
    res.status(403).json({ message: "Access denied" });
  }

  try {
    // Учитываем и забронированные, и завершённые сеансы
    const statuses = [SessionStatus.BOOKED, SessionStatus.COMPLETED];

    const rows = await knex("Sessions as s")
      .join("WorkingHours as wh", "s.working_hour_id", "wh.id")
      .whereIn("s.status", statuses)
      .groupByRaw("wh.day_of_week, CAST(LEFT(wh.start_time, 2) AS UNSIGNED)")
      .select(
        "wh.day_of_week",
        knex.raw("CAST(LEFT(wh.start_time, 2) AS UNSIGNED) AS hour"),
        knex.raw("COUNT(*) AS count")
      );

    // Приводим count к числу
    const result = rows.map((r: any) => ({
      day_of_week: r.day_of_week,
      hour: typeof r.hour === "string" ? parseInt(r.hour, 10) : r.hour,
      count: typeof r.count === "string" ? parseInt(r.count, 10) : r.count,
    }));

    res.status(200).json(result);
  } catch (err) {
    logger.error("Error fetching load heatmap", { error: err });
    next(err);
  }
};