// Импорт необходимых модулей
import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/index'; // Подключение маршрутов пользователя
import { logRequests } from './middleware/logger'; // Middleware для логирования
import { errorHandler } from './middleware/errorHandler'; // Middleware для обработки ошибок
import cors from 'cors';


dotenv.config(); // Загрузка переменных окружения из .env

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // Укажите адрес вашего клиента
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешённые HTTP-методы
  credentials: true, // Если требуется отправка cookie
}));

// Middleware для обработки JSON
app.use(express.json());

// Middleware для логирования запросов
app.use(logRequests);

// Подключение маршрутов
app.use('/api', apiRoutes);

// Обработчик ошибок (должен быть последним middleware)
app.use(errorHandler);

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

