import { Knex } from "knex";

export const up = async function (knex: Knex) {
  await knex.schema.createTable("Sessions", (table) => {
    table.increments("id").primary(); // Уникальный идентификатор
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Users")
      .onDelete("CASCADE"); // Ссылка на пользователя
    table
      .integer("working_hour_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("WorkingHours")
      .onDelete("CASCADE"); // Ссылка на рабочий час
    table
      .integer("district_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Districts")
      .onDelete("CASCADE"); // Ссылка на отдел
    table
      .enu("status", [
        "pending_confirmation",
        "booked",
        "in_progress",
        "completed",
        "canceled",
      ])
      .notNullable()
      .defaultTo("pending_confirmation"); // Статус сессии
    table.text("comments").nullable(); // Комментарии
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

export const down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists("Sessions");
};
