// seeds/02_add_super_admin.ts
import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { User } from "../src/interfaces/model";
/**
 * Добавляет одного супер-админа, если он ещё не существует.
 */
export async function seed(knex: Knex): Promise<void> {
  // Проверяем, есть ли уже супер-админ
  const exists = await knex<User>('Users')
    .where({ role: 'super_admin' })
    .first();

  // Параметры нового супер-админа
  const name = 'Super Admin';
  const email = 'superadmin';
  const rawPassword = '1';
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

  // Seed Local Admins
  const localAdmins = [
    { name: 'Local Admin 1', email: 'localadmin1', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Local Admin 2', email: 'localadmin2', rawPassword: '1', phone: "+777 777 77 77" }
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
    }
  }

  // Seed Employees
  const employees = [
    { name: 'Employee One', email: 'employee1', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Employee Two', email: 'employee2', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Employee Three', email: 'employee3', rawPassword: '1', phone: "+777 777 77 77" }
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
    }
  }

  // Seed Clients
  const clients = [
    { name: 'Client One', email: 'client1', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Client Two', email: 'client2', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Client Three', email: 'client3', rawPassword: '1', phone: "+777 777 77 77" },
    { name: 'Client Four', email: 'client4', rawPassword: '1', phone: "+777 777 77 77" }
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
    }
  }
}
