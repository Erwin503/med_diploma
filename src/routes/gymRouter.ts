import express from 'express';
import {
  addGym,
  getAllGyms,
  getGymById,
  updateGym,
  deleteGym,
} from '../controllers/districtController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/checkRole';

const router = express.Router();

// Доступ к добавлению зала только для роли "super_admin"
router.post('/', authenticateToken, checkRole(['super_admin']), addGym);

// Доступ к получению всех залов только для роли "super_admin"
router.get('/', authenticateToken, checkRole(['super_admin']), getAllGyms);

// Доступ к получению зала по ID только для роли "super_admin"
router.get('/:id', authenticateToken, checkRole(['super_admin']), getGymById);

// Доступ к обновлению зала только для роли "super_admin"
router.put('/:id', authenticateToken, checkRole(['super_admin']), updateGym);

// Доступ к удалению зала только для роли "super_admin"
router.delete('/:id', authenticateToken, checkRole(['super_admin']), deleteGym);

export default router;
