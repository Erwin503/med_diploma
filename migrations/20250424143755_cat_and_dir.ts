import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Создаём таблицу категорий
  await knex.schema.createTable('Categories', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.integer('district_id').unsigned().notNullable()
      .references('id').inTable('Districts')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });

  // Создаём таблицу направлений
  await knex.schema.createTable('Directions', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.text('requirements').nullable();
    table.integer('category_id').unsigned().notNullable()
      .references('id').inTable('Categories')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamps(true, true);
  });

  // Добавляем связь направления к сессиям
  await knex.schema.alterTable('Sessions', table => {
    table.integer('direction_id').unsigned().nullable()
      .references('id').inTable('Directions')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Откатируем изменения
  await knex.schema.alterTable('Sessions', table => {
    table.dropColumn('direction_id');
  });
  await knex.schema.dropTableIfExists('Directions');
  await knex.schema.dropTableIfExists('Categories');
}  