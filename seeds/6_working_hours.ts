import { Knex } from 'knex';
import logger from '../src/utils/logger';
import { User, WorkingHours } from '../src/interfaces/model';

/**
 * Сид: заполнить WorkingHours для каждого сотрудника
 * - Для каждого пользователя с ролью "employee"
 * - На каждый рабочий день (понедельник-пятница) по часовым слотам с 09:00 до 17:00 на ближайшую неделю
 */
export async function seed(knex: Knex): Promise<void> {
  // Получаем всех сотрудников
  const employees: User[] = await knex<User>('Users').where({ role: 'employee' });

  // Определяем временные слоты
  const slots = [
    { start_time: '09:00', end_time: '10:00' },
    { start_time: '10:00', end_time: '11:00' },
    { start_time: '11:00', end_time: '12:00' },
    { start_time: '13:00', end_time: '14:00' },
    { start_time: '14:00', end_time: '15:00' },
    { start_time: '15:00', end_time: '16:00' },
    { start_time: '16:00', end_time: '17:00' },
  ];

  // Рабочие дни недели (1=Monday ... 5=Friday)
  const workDays = [1, 2, 3, 4, 5];

  // Карта индексов дней в строковые названия
  const dayNames: Array<WorkingHours['day_of_week']> = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  for (const emp of employees) {
    // Проверяем, нет ли уже расписания для этого сотрудника
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
          start_time: slot.start_time,
          end_time: slot.end_time,
        });
      }
    }

    // Вставляем записи одним батчем
    try {
      await knex<WorkingHours>('WorkingHours').insert(records);
      logger.info(`Seeded ${records.length} working hours for employee ${emp.id}`);
    } catch (error) {
      logger.error(`Error seeding WorkingHours for employee ${emp.id}:`, error);
    }
  }
}
