import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("Districts", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("address", 255);
    table.string("phone", 20);
    table.string("email", 100);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("Districts");
}
