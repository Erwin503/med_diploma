import { Knex } from "knex";
import logger from "../src/utils/logger";
import { Direction } from "../src/interfaces/model";

/**
 * Сид: заполнить Directions конкретными видами услуг в зависимости от отделения и категории
 */
export async function seed(knex: Knex): Promise<void> {
  const directions: Partial<Direction>[] = [
    // Терапевтическое отделение (district_id = 1)
    {
      name: "Общий терапевтический осмотр",
      description: "Первичная оценка состояния пациента терапевтом",
      requirements: "Медкарта, направление от врача общей практики",
      category_id: 1,
    },
    {
      name: "Лабораторное обследование крови",
      description: "Анализ общего и биохимического состава крови",
      requirements: "Направление терапевта, пустой желудок",
      category_id: 1,
    },
    {
      name: "Функциональное обследование легких (спирометрия)",
      description: "Оценка функции дыхательной системы",
      requirements: "Без бронходилататоров за 6 часов до исследования",
      category_id: 1,
    },
    {
      name: "Малоинвазивная терапевтическая операция",
      description: "Лечение язвенной болезни эндоскопическим методом",
      requirements: "Предварительное обследование, согласие пациента",
      category_id: 2,
    },
    {
      name: "Стационарная терапия",
      description: "Лечение хронических заболеваний под наблюдением",
      requirements: "Направление из амбулатории, результаты анализов",
      category_id: 2,
    },
    {
      name: "Контрольный осмотр после терапии",
      description: "Оценка результатов лечения и корректировка терапии",
      requirements: "Результаты предыдущих обследований",
      category_id: 3,
    },

    // Хирургическое отделение (district_id = 2)
    {
      name: "Консультация хирурга",
      description: "Осмотр и оценка показаний для операции",
      requirements: "Медкарта, результаты УЗИ",
      category_id: 4,
    },
    {
      name: "УЗИ перед операцией",
      description: "Ультразвуковое исследование зон вмешательства",
      requirements: "Направление хирурга",
      category_id: 4,
    },
    {
      name: "Плановая лапароскопическая операция",
      description: "Минимально инвазивное вмешательство в брюшной полости",
      requirements: "Предоперационные анализы",
      category_id: 5,
    },
    {
      name: "Экстренная хирургия",
      description: "Срочное оперативное вмешательство при травмах",
      requirements: "Решение консилиума врачей",
      category_id: 5,
    },
    {
      name: "Послеоперационный осмотр",
      description: "Оценка состояния пациента после операции",
      requirements: "История болезни, протокол операции",
      category_id: 6,
    },

    // Педиатрическое отделение (district_id = 3)
    {
      name: "Общий педиатрический осмотр",
      description: "Проверка здоровья ребёнка педиатром",
      requirements: "Свидетельство о рождении, медицинская карта",
      category_id: 7,
    },
    {
      name: "Вакцинация",
      description: "Плановая иммунизация детей",
      requirements: "Прививочный сертификат",
      category_id: 7,
    },
    {
      name: "УЗИ органов брюшной полости у детей",
      description: "Инструментальное обследование ребёнка",
      requirements: "Пустой желудок",
      category_id: 7,
    },
    {
      name: "Амбулаторная малоинвазивная операция",
      description: "Малотравматичные процедуры детям",
      requirements: "Направление педиатра",
      category_id: 8,
    },
    {
      name: "Госпитализация в педиатрическое отделение",
      description: "Стационарное лечение ребёнка",
      requirements: "Направление врача, согласие родителей",
      category_id: 8,
    },
    {
      name: "Контрольный педиатрический осмотр",
      description: "Оценка развития после лечения",
      requirements: "История болезни",
      category_id: 9,
    },

    // Кардиологическое отделение (district_id = 4)
    {
      name: "Стандартный кардиологический осмотр",
      description: "Консультация кардиолога",
      requirements: "Медкарта, ЭКГ",
      category_id: 10,
    },
    {
      name: "ЭКГ с нагрузкой",
      description: "Тредмил-тест для оценки работы сердца",
      requirements: "Спортивная одежда, направл. кардиолога",
      category_id: 10,
    },
    {
      name: "Эхокардиография",
      description: "УЗИ сердца",
      requirements: "Направление кардиолога",
      category_id: 10,
    },
    {
      name: "Кардиохирургическая операция",
      description: "Операции на сердце",
      requirements: "Полное предоперационное обследование",
      category_id: 11,
    },
    {
      name: "Стационарное кардиологическое наблюдение",
      description: "Лечение под наблюдением кардиологов",
      requirements: "Направление из поликлиники",
      category_id: 11,
    },
    {
      name: "Контрольный кардиологический осмотр",
      description: "Оценка после оперативного и консервативного лечения",
      requirements: "Результаты анализов и исследований",
      category_id: 12,
    },

    // Неврологическое отделение (district_id = 5)
    {
      name: "Неврологический осмотр",
      description: "Консультация невролога",
      requirements: "Медкарта, результаты МРТ/КТ",
      category_id: 13,
    },
    {
      name: "ЭЭГ",
      description: "Исследование электрической активности мозга",
      requirements: "Направление невролога",
      category_id: 13,
    },
    {
      name: "Лечебная блокада",
      description: "Инъекционные процедуры для купирования боли",
      requirements: "Направление терапевта",
      category_id: 14,
    },
    {
      name: "Стационарная неврологическая терапия",
      description: "Лечение под наблюдением",
      requirements: "Направление из поликлиники",
      category_id: 14,
    },
    {
      name: "Контрольный неврологический осмотр",
      description: "Оценка динамики лечения",
      requirements: "История болезни",
      category_id: 15,
    },

    // Онкологическое отделение (district_id = 6)
    {
      name: "Онкологическая консультация",
      description: "Оценка состояния и плана лечения",
      requirements: "Медкарта, результаты биопсии",
      category_id: 16,
    },
    {
      name: "Лучевая терапия",
      description: "Облучение злокачественных образований",
      requirements: "Протокол онкодиспансера",
      category_id: 16,
    },
    {
      name: "Химиотерапия",
      description: "Лекарственная терапия при онкологии",
      requirements: "Направление онколога",
      category_id: 16,
    },
    {
      name: "Онкологическая операция",
      description: "Хирургическое удаление опухоли",
      requirements: "Полное обследование, согласие пациента",
      category_id: 17,
    },
    {
      name: "Стационарное онкологическое лечение",
      description: "Комплексная терапия в стационаре",
      requirements: "Направление онкодиспансера",
      category_id: 17,
    },
    {
      name: "Контрольный онкологический осмотр",
      description: "Оценка результатов лечения",
      requirements: "История болезни и протокол лечения",
      category_id: 18,
    },

    // Офтальмологическое отделение (district_id = 7)
    {
      name: "Офтальмологический осмотр",
      description: "Проверка остроты зрения и состояния глаз",
      requirements: "Без контактных линз",
      category_id: 19,
    },
    {
      name: "Тонометрия",
      description: "Измерение внутриглазного давления",
      requirements: "Без глазных капель за 12 часов",
      category_id: 19,
    },
    {
      name: "Лазерная коррекция зрения",
      description: "Лечение близорукости и астигматизма лазером",
      requirements: "Полное обследование глаз",
      category_id: 20,
    },
    {
      name: "Операция катаракты",
      description: "Замена хрусталика глаза",
      requirements: "Направление офтальмолога",
      category_id: 20,
    },
    {
      name: "Контрольный офтальмологический осмотр",
      description: "Проверка результата операции",
      requirements: "История болезни",
      category_id: 21,
    },

    // Гастроэнтерологическое отделение (district_id = 8)
    {
      name: "Гастроскопия",
      description: "Эндоскопическое обследование пищевода и желудка",
      requirements: "Пустой желудок 8 часов",
      category_id: 22,
    },
    {
      name: "Колоноскопия",
      description: "Эндоскопическое обследование кишечника",
      requirements: "Подготовка кишечника",
      category_id: 22,
    },
    {
      name: "Лечебная эндоскопическая операция",
      description: "Удаление полипов",
      requirements: "Направление гастроэнтеролога",
      category_id: 23,
    },
    {
      name: "Стационарная гастротерапия",
      description: "Лечение заболеваний ЖКТ",
      requirements: "Направление из поликлиники",
      category_id: 23,
    },
    {
      name: "Контрольный гастроэнтерологический осмотр",
      description: "Оценка состояния после лечения",
      requirements: "Результаты предыдущих обследований",
      category_id: 24,
    },

    // Эндокринологическое отделение (district_id = 9)
    {
      name: "Эндокринологический осмотр",
      description: "Оценка гормонального фона",
      requirements: "Анализы на гормоны",
      category_id: 25,
    },
    {
      name: "Глюкозотолерантный тест",
      description: "Исследование реакции на нагрузку глюкозой",
      requirements: "Постный режим",
      category_id: 25,
    },
    {
      name: "Инсулинотерапия",
      description: "Курс введения инсулина",
      requirements: "Направление эндокринолога",
      category_id: 26,
    },
    {
      name: "Стационарное эндокринологическое лечение",
      description: "Лечение заболеваний обмена веществ",
      requirements: "Направление из поликлиники",
      category_id: 26,
    },
    {
      name: "Контрольный эндокринологический осмотр",
      description: "Оценка результатов лечения",
      requirements: "История болезни и анализы",
      category_id: 27,
    },

    // Стоматологическое отделение (district_id = 10)
    {
      name: "Общий стоматологический осмотр",
      description: "Проверка состояния зубов и десен",
      requirements: "Гигиена полости рта",
      category_id: 28,
    },
    {
      name: "Профгигиена полости рта",
      description: "Удаление зубного налета и камня",
      requirements: "Без еды за 2 часа",
      category_id: 28,
    },
    {
      name: "Лечение кариеса",
      description: "Прямая реставрация зуба",
      requirements: "Рентген зуба",
      category_id: 28,
    },
    {
      name: "Хирургическая стоматологическая операция",
      description: "Удаление зуба или имплантация",
      requirements: "Рентген и анализ крови",
      category_id: 29,
    },
    {
      name: "Профилактический стоматологический осмотр",
      description: "Оценка после лечения",
      requirements: "История лечения",
      category_id: 30,
    },
  ];

  for (const dir of directions) {
    try {
      const exists = await knex<Direction>("Directions")
        .where({ name: dir.name, category_id: dir.category_id })
        .first();
      if (exists) {
        logger.info(
          `Direction '${dir.name}' in category ${dir.category_id} exists, skipping.`
        );
      } else {
        await knex<Direction>("Directions").insert(dir);
        logger.info(
          `Seeded direction '${dir.name}' for category ${dir.category_id}`
        );
      }
    } catch (error) {
      logger.error(
        `Error seeding direction '${dir.name}' for category ${dir.category_id}:`,
        error
      );
    }
  }
}
