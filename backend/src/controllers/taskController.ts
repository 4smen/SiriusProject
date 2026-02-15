import { Request, Response } from 'express';
import { db } from '../db';
import { TaskCreateDTO, TaskUpdateDTO, PaginatedResponse } from '../types/task';
import { aiService } from '../services/aiService';

//получение задачек с пагинацией и сортировкой
export const getTasks = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 3;
        const sortField = (req.query.sortField as string) || 'createdAt';
        const sortOrder = (req.query.sortOrder as string) || 'DESC';

        const offset = (page - 1) * limit;

        const allowedFields = ['username', 'email', 'isCompleted', 'createdAt'];
        const field = allowedFields.includes(sortField) ? sortField : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const totalResult = await db.get('SELECT COUNT(*) as count FROM tasks');
        const total = totalResult.count;

        const tasks = await db.all(
            `SELECT * FROM tasks 
             ORDER BY ${field} ${order}
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const response: PaginatedResponse<any> = {
            data: tasks,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//создание задачи
export const createTask = async (req: Request, res: Response) => {
    try {
        const { username, email, text }: TaskCreateDTO = req.body;

        const now = new Date();

        const localTime = now.toISOString();

        const correctTime = new Date().toLocaleString('sv-SE');
        
        await db.run(
            'INSERT INTO tasks (username, email, text, createdAt) VALUES (?, ?, ?, ?)',
            [username, email, text, correctTime])

        if (!username || !email || !text) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await db.run(
            'INSERT INTO tasks (username, email, text) VALUES (?, ?, ?)',
            [username, email, text]
        );

        const newTask = await db.get(
            'SELECT * FROM tasks WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//обновление задачи (только для админа)
export const updateTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id);
        const { text, isCompleted }: TaskUpdateDTO = req.body;
        const isAdmin = (req as any).user?.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (text !== undefined && text !== task.text) {
            updates.push('text = ?');
            values.push(text);
            updates.push('isEdited = 1');
        }

        if (isCompleted !== undefined) {
            updates.push('isCompleted = ?');
            values.push(isCompleted ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No changes provided' });
        }

        values.push(taskId);

        await db.run(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedTask = await db.get(
            'SELECT * FROM tasks WHERE id = ?',
            [taskId]
        );

        if (isCompleted && !task.isCompleted) {
            aiService.checkCompletedTask(taskId).then(anomaly => {
                if (anomaly) {
                    console.log(`Anomaly detected for task ${taskId}:`, anomaly);
                }
            }).catch(error => {
                console.error('Error checking anomaly:', error);
            });
        }

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//получение статистики
export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN isEdited = 1 THEN 1 ELSE 0 END) as edited
            FROM tasks
        `);

        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//получение всех аномалий (только для админа)
export const getAnomalies = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).user?.isAdmin;
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const anomalies = await aiService.getActiveAnomalies();
        res.json(anomalies);
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//ручная проверка всех активных задач
export const checkAllTasksAnomalies = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).user?.isAdmin;
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const anomalies = await aiService.checkAllActiveTasks();
        res.json({
            message: `Проверено задач, найдено аномалий: ${anomalies.length}`,
            anomalies
        });
    } catch (error) {
        console.error('Error checking all tasks anomalies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//отметить аномалию как решенную
export const resolveAnomaly = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).user?.isAdmin;
        const anomalyId = parseInt(req.params.id);
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const success = await aiService.resolveAnomaly(anomalyId);
        
        if (success) {
            res.json({ message: 'Anomaly resolved successfully' });
        } else {
            res.status(404).json({ error: 'Anomaly not found' });
        }
    } catch (error) {
        console.error('Error resolving anomaly:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//выполнить задачу из аномалии
export const completeTaskFromAnomaly = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).user?.isAdmin;
        const anomalyId = parseInt(req.params.id);
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'требуются права администратора' });
        }

        const success = await aiService.completeTaskFromAnomaly(anomalyId);
        
        if (success) {
            const anomalies = await aiService.getActiveAnomalies();
            res.json({ 
                message: 'задача выполнена успешно',
                anomalies 
            });
        } else {
            res.status(404).json({ error: 'аномалия не найдена' });
        }
    } catch (error) {
        console.error('ошибка при выполнении задачи из аномалии:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};