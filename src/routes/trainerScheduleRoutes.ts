import express from 'express';
import {
  addWorkingHours,
  getWorkingHours,
  updateWorkingHours,
  deleteWorkingHours,
  getTrainerScheduleByID
} from '../controllers/trainerScheduleController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

// Добавление рабочего времени
router.post('/', authenticateToken, checkRole(['trainer', ' gym_admin', 'super_admin']), addWorkingHours);

// Получение рабочего расписания
router.get('/', authenticateToken, checkRole(['trainer', ' gym_admin', 'super_admin']), getWorkingHours);

router.get('/byid/:id', getTrainerScheduleByID)

// Обновление рабочего времени по ID
router.put('/:id', authenticateToken, checkRole(['trainer', ' gym_admin', 'super_admin']), updateWorkingHours);

// Удаление рабочего времени по ID
router.delete('/:id', authenticateToken, checkRole(['trainer', ' gym_admin', 'super_admin']), deleteWorkingHours);

export default router;
