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

// публичные роуты (доступны всем авторизованным)
router.get('/', authenticate, getTasks);
router.get('/stats', authenticate, getStats);
router.get('/my', authenticate, getUserTasks); // задачи текущего пользователя
router.get('/:id', authenticate, getTaskById);

// роуты только для админа
router.post('/', authenticate, requireAdmin, createTask); // админ создаёт задачу (из запроса)
router.patch('/:id', authenticate, requireAdmin, updateTask);

export default router;