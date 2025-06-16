import { Knex } from "knex";
import logger from "../src/utils/logger";
import {
  User,
  WorkingHours,
  EmployeeDetails,
  Direction,
  Session,
} from "../src/interfaces/model";

/**
 * Сид: заполнить Sessions на основе WorkingHours
 * - Генерируем 40 записей
 * - Назначаем клиентам циклически
 * - Статусы: completed, booked, canceled
 * - Привязываем к случайному или циклическому direction
 */
export async function seed(knex: Knex): Promise<void> {
  const clients: User[] = await knex<User>("Users").where({ role: "user" });
  if (!clients.length) {
    logger.info("No clients found, skipping sessions seeding.");
    return;
  }

  // Берём 40 первых рабочих слотов
  const workingHours: WorkingHours[] = await knex<WorkingHours>(
    "WorkingHours"
  ).limit(40);
  if (!workingHours.length) {
    logger.info("No working hours found, skipping sessions seeding.");
    return;
  }

  const directions: Direction[] = await knex<Direction>("Directions").select(
    "id"
  );
  if (!directions.length) {
    logger.info("No directions found, skipping sessions seeding.");
    return;
  }

  const records: Partial<Session & { direction_id: number }>[] = [];
  const now = new Date();

  for (let i = 0; i < 40; i++) {
    const wh = workingHours[i % workingHours.length];
    const client = clients[i % clients.length];
    const dir = directions[i % directions.length];

    let status: Session["status"];
    let updatedAt = now;
    let comments: string | null = null;

    if (i < 10) {
      status = "completed";
      comments = "Session completed successfully";
      updatedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    } else if (i < 25) {
      status = "booked";
    } else {
      status = "canceled";
      comments = "Client canceled the session";
      updatedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Определяем district через детали сотрудника
    const empDet = await knex<EmployeeDetails>("EmployeeDetails")
      .where({ user_id: wh.employee_id })
      .first();
    const districtId = empDet?.district_id ?? 1;

    records.push({
      user_id: client.id!,
      working_hour_id: wh.id!,
      district_id: districtId,
      direction_id: dir.id!,
      status,
      comments: comments || undefined,
      created_at: now,
      updated_at: updatedAt,
    });
  }

  try {
    await knex<Session>("Sessions").insert(records);
    logger.info(`Seeded ${records.length} sessions`);
  } catch (error) {
    logger.error("Error seeding sessions:", error);
  }
}
