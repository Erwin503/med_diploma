import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("QueueQrTokens", (table) => {
    table.increments("id").primary();
    table.uuid("token").notNullable().unique();
    table
      .integer("session_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Sessions")
      .onDelete("CASCADE");
    table.timestamp("expires_at").defaultTo(null);
    table.boolean("used").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("queue_qr_tokens");
}
