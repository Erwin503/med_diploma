import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const has = await knex.schema.hasColumn("Sessions", "direction_id");
  if (!has) {
    await knex.schema.alterTable("Sessions", (table) => {
      table
        .integer("direction_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("Directions")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const has = await knex.schema.hasColumn("Sessions", "direction_id");
  if (has) {
    await knex.schema.alterTable("Sessions", (table) => {
      table.dropColumn("direction_id");
    });
  }
}
