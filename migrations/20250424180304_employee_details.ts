import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("EmployeeDetails", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Users")
      .onDelete("CASCADE");
    table.string("specialization", 255);
    table.integer("experience_years");
    table.text("bio");
    table.text("certifications");
    // Привязка к отделу
    table
      .integer("district_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Districts")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("EmployeeDetails");
  // Сначала сбросим внешний ключ
  await knex.schema.alterTable("EmployeeDetails", (table) => {
    table.dropColumn("district_id");
  });
  await knex.schema.dropTable("EmployeeDetails");
}
