import { Request, Response } from 'express';
import { db } from '../db';
import { aiService } from '../services/aiService';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const sortField = (req.query.sortField as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as string) || 'DESC';

        const offset = (page - 1) * limit;

        const allowedFields = ['title', 'isCompleted', 'createdAt', 'completedAt'];
        const field = allowedFields.includes(sortField) ? sortField : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const totalResult = await db.get('SELECT COUNT(*) as count FROM tasks');
        const total = totalResult.count;

        const tasks = await db.all(`
            SELECT 
                t.*,
                u.username,
                u.email as userEmail,
                p.name as projectName
            FROM tasks t
            JOIN users u ON t.userId = u.id
            JOIN projects p ON t.projectId = p.id
            ORDER BY t.${field} ${order}
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({
            data: tasks,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        });

    } catch (error) {
        console.error('ошибка получения задач:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

export const getUserTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const tasks = await db.all(`
            SELECT 
                t.*,
                p.name as projectName
            FROM tasks t
            JOIN projects p ON t.projectId = p.id
            WHERE t.userId = ?
            ORDER BY t.createdAt DESC
        `, [userId]);

        res.json(tasks);
    } catch (error) {
        console.error('ошибка получения задач пользователя:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await db.get(`
            SELECT 
                t.*,
                u.username,
                u.email as userEmail,
                p.name as projectName
            FROM tasks t
            JOIN users u ON t.userId = u.id
            JOIN projects p ON t.projectId = p.id
            WHERE t.id = ?
        `, [taskId]);

        if (!task) {
            return res.status(404).json({ error: 'задача не найдена' });
        }

        res.json(task);
    } catch (error) {
        console.error('ошибка получения задачи:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { userId, projectId, title, description, requestId } = req.body;

        if (!userId || !projectId || !title || !description) {
            return res.status(400).json({ error: 'все поля обязательны' });
        }

        const now = new Date().toISOString();

        const result = await db.run(
            `INSERT INTO tasks 
             (userId, projectId, title, description, createdAt, requestId) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, projectId, title, description, now, requestId || null]
        );

        const task = await db.get(`
            SELECT 
                t.*,
                u.username,
                p.name as projectName
            FROM tasks t
            JOIN users u ON t.userId = u.id
            JOIN projects p ON t.projectId = p.id
            WHERE t.id = ?
        `, [result.lastID]);

        res.status(201).json(task);

    } catch (error) {
        console.error('ошибка создания задачи:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id);
        const { isCompleted, text } = req.body;

        const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'задача не найдена' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (text !== undefined && text !== task.description) {
            updates.push('description = ?');
            values.push(text);
            updates.push('isEdited = 1');
        }

        if (isCompleted !== undefined) {
            updates.push('isCompleted = ?');
            values.push(isCompleted ? 1 : 0);
            
            if (isCompleted && !task.isCompleted) {
                updates.push('completedAt = ?');
                values.push(new Date().toISOString());
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'нет изменений' });
        }

        values.push(taskId);

        await db.run(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedTask = await db.get(`
            SELECT 
                t.*,
                u.username,
                p.name as projectName
            FROM tasks t
            JOIN users u ON t.userId = u.id
            JOIN projects p ON t.projectId = p.id
            WHERE t.id = ?
        `, [taskId]);

        if (isCompleted && !task.isCompleted) {
            aiService.checkCompletedTask(taskId).catch(error => {
                console.error('ошибка проверки аномалии:', error);
            });
        }

        res.json(updatedTask);

    } catch (error) {
        console.error('ошибка обновления задачи:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN isEdited = 1 THEN 1 ELSE 0 END) as edited
            FROM tasks
        `);

        const projectsCount = await db.get('SELECT COUNT(*) as count FROM projects');
        const usersCount = await db.get('SELECT COUNT(*) as count FROM users');

        res.json({
            tasks: stats,
            projects: projectsCount.count,
            users: usersCount.count
        });

    } catch (error) {
        console.error('ошибка получения статистики:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};