"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const db_1 = require("../db");
const getTasks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'DESC';
        const offset = (page - 1) * limit;
        const allowedFields = ['username', 'email', 'isCompleted', 'createdAt'];
        const field = allowedFields.includes(sortField) ? sortField : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const totalResult = await db_1.db.get('SELECT COUNT(*) as count FROM tasks');
        const total = totalResult.count;
        const tasks = await db_1.db.all(`SELECT * FROM tasks 
       ORDER BY ${field} ${order}
       LIMIT ? OFFSET ?`, [limit, offset]);
        const response = {
            data: tasks,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
                limit
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTasks = getTasks;
//создание новой задачи
const createTask = async (req, res) => {
    try {
        const { username, email, text } = req.body;
        if (!username || !email || !text) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        const result = await db_1.db.run('INSERT INTO tasks (username, email, text) VALUES (?, ?, ?)', [username, email, text]);
        const newTask = await db_1.db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
        res.status(201).json(newTask);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createTask = createTask;
//обновление задачи (только для администратора)
const updateTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { text, isCompleted } = req.body;
        const isAdmin = req.user?.isAdmin;
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const task = await db_1.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const updates = [];
        const values = [];
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
        await db_1.db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
        const updatedTask = await db_1.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.json(updatedTask);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateTask = updateTask;
//получение статистики
const getStats = async (req, res) => {
    try {
        const stats = await db_1.db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN isEdited = 1 THEN 1 ELSE 0 END) as edited
      FROM tasks
    `);
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStats = getStats;
