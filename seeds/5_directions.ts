// seeds/06_seed_directions.ts
import { Knex } from "knex";
import logger from "../src/utils/logger";
import { Direction } from "../src/interfaces/model";

/**
 * Сид: заполнить Directions начальными записями
 */
export async function seed(knex: Knex): Promise<void> {
  const directions: Partial<Direction>[] = [
    {
      name: "Выдача паспорта гражданина РФ",
      description: "Оформление и выдача внутреннего паспорта",
      requirements: "Заполненное заявление, фото, квитанция об оплате",
      category_id: 1,
    },
    {
      name: "Замена паспорта при утрате",
      description:
        "Процедура выдачи нового паспорта при утере или порче старого",
      requirements: "Заявление, акт утери или экспертное заключение, квитанция",
      category_id: 2,
    },
    {
      name: "Первичное получение водительского удостоверения",
      description: "Оформление водительских прав впервые",
      requirements: "Медсправка, удостоверение личности, экзаменационный билет",
      category_id: 3,
    },
    {
      name: "Замена водительских прав",
      description:
        "Процедура замены просроченных или утраченных водительских прав",
      requirements: "Старая водительская права, заявление, квитанция",
      category_id: 3,
    },
    {
      name: "Выдача справки о судимости",
      description: "Получение справки о наличии или отсутствии судимости",
      requirements: "Удостоверение личности, заявление",
      category_id: 4,
    },
  ];

  for (const dir of directions) {
    const exists = await knex<Direction>("Directions")
      .where({ name: dir.name, category_id: dir.category_id })
      .first();

    if (exists) {
      logger.info(
        `Direction '${dir.name}' already exists in category ${dir.category_id}, skipping.`
      );
    } else {
      await knex<Direction>("Directions").insert(dir);
      logger.info(
        `Seeded direction: '${dir.name}' for category ${dir.category_id}`
      );
    }
  }
}
