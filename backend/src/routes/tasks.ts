import { Router } from 'express';
import { getTasks, createTask, updateTask, getStats } from '../controllers/taskController';
import { authenticateAdmin, requireAdmin } from '../middleware/auth';

const router = Router();

// Публичные роуты
router.get('/', getTasks);
router.post('/', createTask);
router.get('/stats', getStats);

// Защищенные роуты (только для администратора)
router.patch('/:id', authenticateAdmin, requireAdmin, updateTask);

export default router;