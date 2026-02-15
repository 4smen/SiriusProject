import { Router } from 'express';
import { 
    getTasks, 
    createTask, 
    updateTask, 
    getStats, 
    getAnomalies,
    checkAllTasksAnomalies,
    resolveAnomaly,
    completeTaskFromAnomaly
} from '../controllers/taskController';
import { authenticateAdmin, requireAdmin } from '../middleware/auth';

const router = Router();

//публичные роуты
router.get('/', getTasks);
router.post('/', createTask);
router.get('/stats', getStats);

//защищенные роуты (только для админа)
router.patch('/:id', authenticateAdmin, requireAdmin, updateTask);

//маршруты для аномалий (только для админа)
router.get('/anomalies', authenticateAdmin, getAnomalies);
router.post('/anomalies/check-all', authenticateAdmin, checkAllTasksAnomalies);
router.post('/anomalies/:id/resolve', authenticateAdmin, resolveAnomaly);
router.post('/anomalies/:id/complete', authenticateAdmin, completeTaskFromAnomaly);

export default router;