import express from 'express';
import { bookTrainingSession, cancelTrainingSession, completeTrainingSession, getUserTrainingSessions } from '../controllers/trainingSessionsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, bookTrainingSession);
router.put('/:id/complete', authenticateToken, completeTrainingSession);
router.put('/:id/cancel', authenticateToken, cancelTrainingSession);
router.get('/my-sessions', authenticateToken, getUserTrainingSessions);

export default router;
