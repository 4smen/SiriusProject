import { Request, Response } from 'express';
import { db } from '../db';

// создать запрос на задачу (обновлённая версия)
export const createTaskRequest = async (req: Request, res: Response) => {
    try {
        const { projectId, title, description, deadline } = req.body;
        const userId = (req as any).user.id;

        console.log('создание запроса:', { projectId, title, description, deadline, userId });

        if (!projectId || !title || !description) {
            return res.status(400).json({ error: 'все поля обязательны' });
        }

        const result = await db.run(
            `INSERT INTO task_requests 
             (userId, projectId, title, description, deadline, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, projectId, title, description, deadline || null]
        );

        const request = await db.get(`
            SELECT tr.*, u.username, u.email, p.name as projectName 
            FROM task_requests tr
            JOIN users u ON tr.userId = u.id
            JOIN projects p ON tr.projectId = p.id
            WHERE tr.id = ?
        `, [result.lastID]);

        console.log('запрос создан:', request);
        res.status(201).json(request);
    } catch (error) {
        console.error('ошибка создания запроса:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

// получить все ожидающие запросы (только для админа)
export const getPendingRequests = async (req: Request, res: Response) => {
    try {
        console.log('получение ожидающих запросов');
        
        const requests = await db.all(`
            SELECT tr.*, u.username, u.email, p.name as projectName 
            FROM task_requests tr
            JOIN users u ON tr.userId = u.id
            JOIN projects p ON tr.projectId = p.id
            WHERE tr.status = 'pending'
            ORDER BY tr.createdAt DESC
        `);
        
        console.log(`найдено запросов: ${requests.length}`);
        res.json(requests);
    } catch (error) {
        console.error('ошибка получения запросов:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

// утвердить запрос (обновлённая версия)
export const approveRequest = async (req: Request, res: Response) => {
    try {
        const requestId = parseInt(req.params.id);
        const { deadline } = req.body;  // ← получаем дедлайн из тела запроса
        const adminId = (req as any).user.id;

        console.log('утверждение запроса:', requestId, 'дедлайн:', deadline);

        const request = await db.get(
            'SELECT * FROM task_requests WHERE id = ?',
            [requestId]
        );

        if (!request) {
            return res.status(404).json({ error: 'запрос не найден' });
        }

        const now = new Date().toISOString();

        // используем переданный дедлайн или из запроса
        const taskDeadline = deadline || request.deadline;

        // создаём задачу из запроса
        const taskResult = await db.run(
            `INSERT INTO tasks 
             (userId, projectId, title, description, deadline, createdAt, requestId) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                request.userId, 
                request.projectId, 
                request.title, 
                request.description, 
                taskDeadline,  // ← используем дедлайн
                now, 
                requestId
            ]
        );

        // обновляем статус запроса
        await db.run(
            `UPDATE task_requests 
             SET status = 'approved', reviewedAt = ?, reviewedBy = ? 
             WHERE id = ?`,
            [now, adminId, requestId]
        );

        const task = await db.get(`
            SELECT t.*, u.username, p.name as projectName 
            FROM tasks t
            JOIN users u ON t.userId = u.id
            JOIN projects p ON t.projectId = p.id
            WHERE t.id = ?
        `, [taskResult.lastID]);

        console.log('задача создана из запроса с дедлайном:', taskDeadline);
        res.json({ message: 'запрос утверждён', task });
    } catch (error) {
        console.error('ошибка утверждения запроса:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};


// отклонить запрос (админ)
export const rejectRequest = async (req: Request, res: Response) => {
    try {
        const requestId = parseInt(req.params.id);
        const adminId = (req as any).user.id;

        console.log('отклонение запроса:', requestId);

        await db.run(
            `UPDATE task_requests 
             SET status = 'rejected', reviewedAt = ?, reviewedBy = ? 
             WHERE id = ?`,
            [new Date().toISOString(), adminId, requestId]
        );

        console.log('запрос отклонён');
        res.json({ message: 'запрос отклонён' });
    } catch (error) {
        console.error('ошибка отклонения запроса:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};