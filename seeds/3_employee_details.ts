// seeds/04_seed_employee_details.ts
import { Knex } from "knex";
import logger from "../src/utils/logger";
import { EmployeeDetails, User } from "../src/interfaces/model";

/**
 * Сид: заполнить EmployeeDetails для локальных админов и сотрудников
 */
export async function seed(knex: Knex): Promise<void> {
  // Список ролей, для которых создаём детали
  const roles: Array<{
    role: "local_admin" | "employee";
    defaultDistrictId: number;
  }> = [
    { role: "local_admin", defaultDistrictId: 1 },
    { role: "employee", defaultDistrictId: 2 },
  ];

  for (const { role, defaultDistrictId } of roles) {
    // Получаем всех пользователей данной роли
    const users = await knex<User>("Users").where({ role });

    for (const user of users) {
      // Проверяем, нет ли уже записи
      const exists = await knex<EmployeeDetails>("EmployeeDetails")
        .where({ user_id: user.id })
        .first();
      if (exists) {
        logger.info(
          `EmployeeDetails for user ${user.email} already exists, skipping.`
        );
        continue;
      }

      // Вставляем запись с пустыми или дефолтными значениями
      await knex<EmployeeDetails>("EmployeeDetails").insert({
        user_id: user.id!, // ID пользователя
        district_id: defaultDistrictId, // Привязка к отделу
        specialization: "Общая поддержка клиентов",
        experience_years: 2,
        bio: "Опыт работы с клиентами и внутренними процессами",
        certifications: "Сертификат ISO 9001",
      });
      logger.info(`Seeded EmployeeDetails for ${role} ${user.email}`);
    }
  }
}
