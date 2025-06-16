import { Knex } from "knex";
import logger from "../src/utils/logger";
import { Category } from "../src/interfaces/model";

/**
 * Сид: заполнить Categories начальными данными для медицинского учреждения
 */
export async function seed(knex: Knex): Promise<void> {
  // Общие категории записей для каждого отделения
  const categories: Partial<Category>[] = [
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 1,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 1,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 1,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 2,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 2,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 2,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 3,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 3,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 3,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 4,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 4,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 4,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 5,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 5,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 5,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 6,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 6,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 6,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 7,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 7,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 7,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 8,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 8,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 8,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 9,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 9,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 9,
    },
    {
      name: "Обследование",
      description: "Общие и специальные медицинские обследования",
      district_id: 10,
    },
    {
      name: "Операция",
      description: "Хирургические вмешательства различного уровня сложности",
      district_id: 10,
    },
    {
      name: "Осмотр",
      description: "Консультации и осмотры специалистов",
      district_id: 10,
    },
  ];

  for (const cat of categories) {
    try {
      const exists = await knex<Category>("Categories")
        .where({ name: cat.name, district_id: cat.district_id })
        .first();
      if (exists) {
        logger.info(
          `Category '${cat.name}' in district ${cat.district_id} exists, skipping.`
        );
      } else {
        await knex<Category>("Categories").insert(cat);
        logger.info(
          `Seeded category '${cat.name}' for district ${cat.district_id}`
        );
      }
    } catch (error) {
      logger.error(
        `Error seeding category '${cat.name}' for district ${cat.district_id}:`,
        error
      );
    }
  }
}
