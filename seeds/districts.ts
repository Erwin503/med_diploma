// seeds/03_add_districts.ts
import { Knex } from 'knex';
import { District } from '../src/interfaces/model';
import logger from '../src/utils/logger';

/**
 * Сид для добавления пары отделов, если они ещё не существуют.
 */
export async function seed(knex: Knex): Promise<void> {
  // Определяем два отдела
  const districts: Partial<District>[] = [
    {
      name: 'Central Office',
      address: '100 Main St',
      phone: '101-202-3030',
      email: 'central@office.com',
    },
    {
      name: 'East Branch',
      address: '200 East St',
      phone: '404-505-6060',
      email: 'east@branch.com',
    },
  ];

  for (const d of districts) {
    // Проверяем, нет ли уже такого отдела по имени
    const exists = await knex<District>('Districts')
      .where({ name: d.name })
      .first();

    if (exists) {
      logger.info(`District '${d.name}' already exists, skipping.`);
    } else {
      await knex<District>('Districts').insert(d);
      logger.info(`Seeded district: ${d.name}`);
    }
  }
}
