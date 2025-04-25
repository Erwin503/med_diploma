// seeds/07_seed_working_hours.ts
import { Knex } from 'knex';
import logger from '../src/utils/logger';
import { User, WorkingHours } from '../src/interfaces/model';

/**
 * Сид: заполнить WorkingHours для каждого сотрудника
 * - Для каждого пользователя с ролью "employee"
 * - На каждый рабочий день (понедельник-пятница) по часовым слотам с 09:00 до 17:00
 */
export async function seed(knex: Knex): Promise<void> {
  // Получаем всех сотрудников
  const employees: User[] = await knex<User>('Users').where({ role: 'employee' });

  // Временные слоты
  const slots = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
  ];

  // Дни недели для работы (1=Monday ... 5=Friday)
  const workDays = [1, 2, 3, 4, 5];

  // Карта индексов дней в названия
  const dayNames: Array<WorkingHours['day_of_week']> = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  for (const emp of employees) {
    // Проверяем, нет ли уже расписания
    const existing = await knex<WorkingHours>('WorkingHours')
      .where({ employee_id: emp.id });
    if (existing.length > 0) {
      logger.info(`WorkingHours for employee ${emp.id} already seeded, skipping.`);
      continue;
    }

    const records: Partial<WorkingHours>[] = [];
    const today = new Date();

    // Генерируем расписание на ближайшие 7 дней
    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const weekday = date.getDay();
      if (!workDays.includes(weekday)) continue;

      const dayName = dayNames[weekday];
      for (const slot of slots) {
        records.push({
          employee_id: emp.id!,
          day_of_week: dayName,
          specific_date: date,
          start_time: slot.start,
          end_time: slot.end,
        });
      }
    }

    // Вставляем записи одним батчем
    await knex<WorkingHours>('WorkingHours').insert(records);
    logger.info(`Seeded ${records.length} working hours for employee ${emp.id}`);
  }
}
