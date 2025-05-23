import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: process.env.DB_CLIENT || 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});

export default db;
