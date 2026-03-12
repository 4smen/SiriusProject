import { Router } from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    getStats,
    getTaskById,
    getUserTasks
} from '../controllers/taskController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// публичные роуты
router.get('/', authenticate, getTasks);
router.get('/stats', authenticate, getStats);
router.get('/my', authenticate, getUserTasks);
router.get('/:id', authenticate, getTaskById);

// роуты только для админа
router.post('/', authenticate, requireAdmin, createTask);
router.patch('/:id', authenticate, requireAdmin, updateTask);

export default router;