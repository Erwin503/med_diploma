import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { User } from "../src/interfaces/model";
import logger from "../src/utils/logger";  

/**
 * Добавляет одного супер-админа, если он ещё не существует.
 */
export async function seed(knex: Knex): Promise<void> {
  // Проверяем, есть ли уже супер-админ
  const exists = await knex<User>('Users')
    .where({ role: 'super_admin' })
    .first();

  if (exists) {
    logger.info('Super admin already exists, skipping seed.');
    return;
  }

  // Параметры нового супер-админа
  const name = 'Super Admin';
  const email = 'superadmin@example.com';
  const rawPassword = 'ChangeMe123!';
  const phone = "+777 777 77 77";
  const role = 'super_admin';

  // Хешируем пароль
  const password_hash = bcrypt.hashSync(rawPassword, 10);

  // Вставляем в базу
  await knex<Partial<User>>('Users').insert({
    name,
    email,
    password_hash,
    phone,
    role,
  });

  logger.info(`Super admin seeded: ${email}`);

  // Seed Local Admins
  const localAdmins = [
    { name: 'Local Admin 1', email: 'localadmin1@example.com', rawPassword: 'LocalPass1!', phone: "+777 777 77 77" },
    { name: 'Local Admin 2', email: 'localadmin2@example.com', rawPassword: 'LocalPass2!', phone: "+777 777 77 77" }
  ];
  for (const admin of localAdmins) {
    const existsAdmin = await knex<User>('Users').where({ email: admin.email }).first();
    if (!existsAdmin) {
      const hash = bcrypt.hashSync(admin.rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name: admin.name,
        email: admin.email,
        password_hash: hash,
        phone: admin.phone,
        role: 'local_admin'
      });
      logger.info(`Local admin seeded: ${admin.email}`);
    }
  }

  // Seed Employees
  const employees = [
    { name: 'Employee One', email: 'employee1@example.com', rawPassword: 'EmpPass1!', phone: "+777 777 77 77" },
    { name: 'Employee Two', email: 'employee2@example.com', rawPassword: 'EmpPass2!', phone: "+777 777 77 77" },
    { name: 'Employee Three', email: 'employee3@example.com', rawPassword: 'EmpPass3!', phone: "+777 777 77 77" }
  ];
  for (const emp of employees) {
    const existsEmp = await knex<User>('Users').where({ email: emp.email }).first();
    if (!existsEmp) {
      const hash = bcrypt.hashSync(emp.rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name: emp.name,
        email: emp.email,
        password_hash: hash,
        phone: emp.phone,
        role: 'employee'
      });
      logger.info(`Employee seeded: ${emp.email}`);
    }
  }

  // Seed Clients
  const clients = [
    { name: 'Client One', email: 'client1@example.com', rawPassword: 'ClientPass1!', phone: "+777 777 77 77" },
    { name: 'Client Two', email: 'client2@example.com', rawPassword: 'ClientPass2!', phone: "+777 777 77 77" },
    { name: 'Client Three', email: 'client3@example.com', rawPassword: 'ClientPass3!', phone: "+777 777 77 77" },
    { name: 'Client Four', email: 'client4@example.com', rawPassword: 'ClientPass4!', phone: "+777 777 77 77" }
  ];
  for (const client of clients) {
    const existsClient = await knex<User>('Users').where({ email: client.email }).first();
    if (!existsClient) {
      const hash = bcrypt.hashSync(client.rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name: client.name,
        email: client.email,
        password_hash: hash,
        phone: client.phone,
        role: 'user'
      });
      logger.info(`Client seeded: ${client.email}`);
    }
  }
}
