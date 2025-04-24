import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("WorkingHours", (table) => {
    table.increments("id").primary();
    table
      .integer("employee_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Users")
      .onDelete("CASCADE");
    table.enu("day_of_week", [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    table.date("specific_date");
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table
      .enu("status", ["available", "booked"])
      .notNullable()
      .defaultTo("available"); // Добавляем статус рабочего часа
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("WorkingHours");
}
