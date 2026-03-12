import { Router } from 'express';
import { getProjects, createProject } from '../controllers/projectController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProjects);
router.post('/', authenticate, requireAdmin, createProject);

export default router;