import { Router } from 'express';
import authRoutes from './auth';
import taskRoutes from './tasks';
import projectRoutes from './projects';
import taskRequestRoutes from './taskRequests';

const router = Router();

// все маршруты api
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/task-requests', taskRequestRoutes);

export default router;