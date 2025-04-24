// Интерфейс для таблицы Users
export interface User {
    id?: number;
    name?: string;
    email: string;
    password_hash: string;
    phone?: string;
    role: 'super_admin' | 'local_admin' | 'employee' | 'user';
  }
  
  // Интерфейс для таблицы EmploeeDetails
  export interface EmployeeDetails {
    id?: number;
    user_id: number; // Ссылка на пользователя
    specialization?: string;
    experience_years?: number;
    bio?: string;
    certifications?: string;
  }
  
  // Интерфейс для таблицы WorkingHours
  export interface WorkingHours {
    id?: number;
    employee_id: number; // Ссылка на тренера
    day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    specific_date?: Date; // Необязательное поле для специфической даты
    start_time: string; // Используем строку для времени
    end_time: string;
  }
  
  // Интерфейс для таблицы Districts
  export interface District {
    id?: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }
  
  // Интерфейс для таблицы Sessions
  export interface Session {
    id: number;
    user_id: number; // Ссылка на пользователя
    emploee_id: number; // Ссылка на сотрудника
    district_id: number; // Ссылка на отдел
    date: Date;
    // training_type?: string;
    comments?: string; // Необязательное поле
    status: 'booked' | 'completed' | 'canceled';
  }
