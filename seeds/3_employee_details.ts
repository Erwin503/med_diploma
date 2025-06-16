import { Knex } from 'knex';
import logger from '../src/utils/logger';
import { EmployeeDetails, User } from '../src/interfaces/model';

/**
 * Сид: заполнить EmployeeDetails для локальных админов и сотрудников медицинских отделений
 */
export async function seed(knex: Knex): Promise<void> {
  // Роли и их дефолтные отделы
  const rolesConfig: Array<{ role: 'local_admin' | 'employee'; defaultDistrictId: number }> = [
    { role: 'local_admin', defaultDistrictId: 1 },
    { role: 'employee', defaultDistrictId: 1 },
  ];

  for (const { role, defaultDistrictId } of rolesConfig) {
    // Все пользователи с данной ролью
    const users = await knex<User>('Users').where({ role });

    for (const user of users) {
      // Проверяем, не существует ли уже детали
      const exists = await knex<EmployeeDetails>('EmployeeDetails')
        .where({ user_id: user.id })
        .first();
      if (exists) {
        logger.info(`EmployeeDetails для ${user.email} уже существует, пропускаем.`);
        continue;
      }

      // Вставляем запись
      await knex<EmployeeDetails>('EmployeeDetails').insert({
        user_id: user.id!,
        district_id: defaultDistrictId,
        specialization: role === 'local_admin'
          ? 'Административная поддержка'
          : 'Общая медицинская практика',
        experience_years: role === 'local_admin' ? 3 : 5,
        bio: role === 'local_admin'
          ? 'Опыт управления процессами и поддержки сотрудников медицинского центра.'
          : 'Квалифицированный специалист с опытом работы в медицинских отделениях.',
        certifications: role === 'local_admin'
          ? 'Менеджмент здравоохранения'
          : 'Первая медицинская помощь, Сертификат ВООЗ',
      });
      logger.info(`Seeded EmployeeDetails для ${role} ${user.email}`);
    }
  }
}
