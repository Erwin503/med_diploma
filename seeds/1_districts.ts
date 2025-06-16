import { Knex } from "knex";
import { District } from "../src/interfaces/model";
import logger from "../src/utils/logger";

export async function seed(knex: Knex): Promise<void> {
  // Определяем список отделов
  const districts: Partial<District>[] = [
    {
      name: "Терапевтическое отделение",
      address: "г. Москва, ул. Ленина, д. 10",
      phone: "8 (495) 111-22-33",
      email: "therapy@hospital.ru",
    },
    {
      name: "Хирургическое отделение",
      address: "г. Санкт-Петербург, Невский пр., д. 20",
      phone: "8 (812) 222-33-44",
      email: "surgery@hospital.ru",
    },
    {
      name: "Педиатрическое отделение",
      address: "г. Казань, ул. Баумана, д. 5",
      phone: "8 (843) 333-44-55",
      email: "pediatrics@hospital.ru",
    },
    {
      name: "Кардиологическое отделение",
      address: "г. Новосибирск, ул. Красный проспект, д. 15",
      phone: "8 (383) 444-55-66",
      email: "cardio@hospital.ru",
    },
    {
      name: "Неврологическое отделение",
      address: "г. Екатеринбург, ул. Малышева, д. 25",
      phone: "8 (343) 555-66-77",
      email: "neuro@hospital.ru",
    },
    {
      name: "Онкологическое отделение",
      address: "г. Нижний Новгород, ул. Большая Покровская, д. 30",
      phone: "8 (831) 666-77-88",
      email: "oncology@hospital.ru",
    },
    {
      name: "Офтальмологическое отделение",
      address: "г. Ростов-на-Дону, ул. Большая Садовая, д. 12",
      phone: "8 (863) 777-88-99",
      email: "ophthalmology@hospital.ru",
    },
    {
      name: "Гастроэнтерологическое отделение",
      address: "г. Уфа, ул. Ленина, д. 8",
      phone: "8 (347) 888-99-00",
      email: "gastro@hospital.ru",
    },
    {
      name: "Эндокринологическое отделение",
      address: "г. Самара, ул. Куйбышева, д. 22",
      phone: "8 (846) 999-00-11",
      email: "endocrine@hospital.ru",
    },
    {
      name: "Стоматологическое отделение",
      address: "г. Челябинск, пр. Ленина, д. 17",
      phone: "8 (351) 000-11-22",
      email: "dental@hospital.ru",
    },
  ];

  for (const d of districts) {
    try {
      // Проверяем, нет ли уже такого отдела по имени
      const exists = await knex<District>("Districts")
        .where({ name: d.name })
        .first();

      if (exists) {
        logger.info(`District '${d.name}' already exists, skipping.`);
      } else {
        await knex<District>("Districts").insert(d);
        logger.info(`Seeded district: ${d.name}`);
      }
    } catch (error) {
      logger.error(`Error seeding district '${d.name}':`, error);
    }
  }
}
