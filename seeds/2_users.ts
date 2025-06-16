import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { User } from '../src/interfaces/model';
import logger from '../src/utils/logger';

/**
 * Сид для добавления супер-админа, локальных админов, сотрудников и пациентов.
 */
export async function seed(knex: Knex): Promise<void> {
  // 1) Super Admin
  const superAdmin = await knex<User>('Users')
    .where({ role: 'super_admin' })
    .first();
  if (!superAdmin) {
    const hash = bcrypt.hashSync('ChangeMe123!', 10);
    await knex<Partial<User>>('Users').insert({
      name: 'Супер Админ',
      email: 'superadmin@hospital.ru',
      password_hash: hash,
      phone: '+7 (777) 777-77-77',
      role: 'super_admin',
    });
    logger.info('Seeded Super Admin');
  } else {
    logger.info('Super Admin exists, skipping');
  }

  // 2) Local Admins
  const localAdmins = [
    { name: 'Алексей Иванов', email: 'ivanov.a@hospital.ru', rawPassword: 'LocalPass1!', phone: '+7 (700) 111-11-11' },
    { name: 'Марина Петрова', email: 'petrova.m@hospital.ru', rawPassword: 'LocalPass2!', phone: '+7 (700) 222-22-22' }
  ];
  for (const admin of localAdmins) {
    const exists = await knex<User>('Users').where({ email: admin.email }).first();
    if (!exists) {
      const hash = bcrypt.hashSync(admin.rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name: admin.name,
        email: admin.email,
        password_hash: hash,
        phone: admin.phone,
        role: 'local_admin',
      });
      logger.info(`Seeded Local Admin: ${admin.email}`);
    }
  }

  // 3) Employees: 2 per department (10 departments)
  const employees = [
    'Ольга Смирнова', 'Дмитрий Козлов',
    'Екатерина Попова', 'Иван Волков',
    'Наталья Соколова', 'Сергей Лебедев',
    'Виктория Новикова', 'Андрей Морозов',
    'Юлия Фёдорова', 'Павел Киселёв',
    'Анна Павлова', 'Михаил Семёнов',
    'Елена Васильева', 'Александр Дмитриев',
    'Татьяна Михайлова', 'Роман Новосёлов',
    'Ирина Орлова', 'Алексей Захаров',
    'Оксана Кузнецова', 'Николай Павленко'
  ];
  let empCount = 0;
  for (const name of employees) {
    empCount++;
    const email = `emp${empCount}@hospital.ru`;
    const phone = `+7 (900) ${100 + empCount}-${10 + empCount}-${20 + empCount}`;
    const rawPassword = `EmpPass${empCount}!`;

    const exists = await knex<User>('Users').where({ email }).first();
    if (!exists) {
      const hash = bcrypt.hashSync(rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name,
        email,
        password_hash: hash,
        phone,
        role: 'employee',
      });
      logger.info(`Seeded Employee: ${email}`);
    }
  }

  // 4) Patients: 10 users
  const patients = [
    'Артём Смирнов', 'Дарья Лебедева', 'Константин Новиков',
    'Светлана Морозова', 'Олег Фёдоров', 'Мария Васильева',
    'Владимир Захаров', 'Елена Киселёва', 'Пётр Орлов', 'Ирина Павленко'
  ];
  for (let i = 0; i < patients.length; i++) {
    const name = patients[i];
    const email = `patient${i + 1}@example.com`;
    const phone = `+7 (910) ${200 + i + 1}-${30 + i + 1}-${40 + i + 1}`;
    const rawPassword = `PatientPass${i + 1}!`;

    const exists = await knex<User>('Users').where({ email }).first();
    if (!exists) {
      const hash = bcrypt.hashSync(rawPassword, 10);
      await knex<Partial<User>>('Users').insert({
        name,
        email,
        password_hash: hash,
        phone,
        role: 'user',
      });
      logger.info(`Seeded Patient: ${email}`);
    }
  }
}
