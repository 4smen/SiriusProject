import { Router } from 'express';
import { 
    createTaskRequest,
    getPendingRequests,
    approveRequest,
    rejectRequest
} from '../controllers/taskRequestController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// для всех авторизованных
router.post('/', authenticate, createTaskRequest);

// только для админа
router.get('/pending', authenticate, requireAdmin, getPendingRequests);
router.post('/:id/approve', authenticate, requireAdmin, approveRequest);
router.post('/:id/reject', authenticate, requireAdmin, rejectRequest);

export default router;