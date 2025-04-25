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
    if (!["super_admin", "local_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
  
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
      const rows: Array<{ name: string; count: string }> = await knex("Sessions as s")
        .join("Directions as d", "s.direction_id", "d.id")
        .where("s.status", "completed")
        .andWhere("s.updated_at", ">=", sevenDaysAgo)
        .groupBy("d.name")
        .select("d.name")
        .count("s.id as count");
  
      const result: Record<string, number> = {};
      rows.forEach((row) => {
        result[row.name] = parseInt(row.count, 10);
      });
  
      return res.status(200).json(result);
    } catch (err) {
      logger.error("Error fetching attendance stats", { error: err });
      return next(err);
    }
  };
  