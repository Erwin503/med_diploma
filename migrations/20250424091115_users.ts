import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("Users", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("email", 100).unique().notNullable();
    table.string("password_hash", 255).notNullable();
    table.string("phone", 20);
    table
      .enu("role", ["super_admin", "local_admin", "employee", "user"])
      .notNullable()
      .defaultTo("user");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("Users");
}
