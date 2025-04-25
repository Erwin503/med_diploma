import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("Notifications", (table) => {
    table.increments("id").primary(); // ID уведомления
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Users")
      .onDelete("CASCADE"); // связь с пользователем
    table.string("title").notNullable(); // заголовок
    table.text("message").nullable(); // сообщение (необязательно)
    table.boolean("read").notNullable().defaultTo(false); // статус прочтения
    table.timestamp("created_at").defaultTo(knex.fn.now()); // дата создания
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("Notifications");
}
