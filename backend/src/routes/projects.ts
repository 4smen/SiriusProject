import { Router } from 'express';
import { getProjects, createProject } from '../controllers/projectController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// все маршруты защищены
router.get('/', authenticate, getProjects);
router.post('/', authenticate, requireAdmin, createProject);

export default router;