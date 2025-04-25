// seeds/05_seed_categories.ts
import { Knex } from 'knex';
import logger from '../src/utils/logger';
import { Category } from '../src/interfaces/model';

/**
 * Сид: заполнить Categories начальными данными
 */
export async function seed(knex: Knex): Promise<void> {
  const categories: Partial<Category>[] = [
    {
      name: 'Оформление паспорта',
      description: 'Услуги по оформлению и выдаче внутренних паспортов',
      district_id: 1,
    },
    {
      name: 'Замена паспорта',
      description: 'Услуга замены утраченного или испорченного паспорта',
      district_id: 1,
    },
    {
      name: 'Оформление прав',
      description: 'Водительские права всех категорий',
      district_id: 2,
    },
    {
      name: 'Справки и выписки',
      description: 'Выдача различных справок и выписок',
      district_id: 2,
    },
  ];

  for (const cat of categories) {
    // Проверяем, нет ли уже категории с таким именем и отделом
    const exists = await knex<Category>('Categories')
      .where({ name: cat.name, district_id: cat.district_id })
      .first();

    if (exists) {
      logger.info(`Category '${cat.name}' in district ${cat.district_id} already exists, skipping.`);
    } else {
      await knex<Category>('Categories').insert(cat);
      logger.info(`Seeded category: '${cat.name}' for district ${cat.district_id}`);
    }
  }
}
