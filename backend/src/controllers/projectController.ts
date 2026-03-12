import { Request, Response } from 'express';
import { db } from '../db';

// получить все проекты
export const getProjects = async (req: Request, res: Response) => {
    try {
        console.log('получение проектов');
        
        const projects = await db.all(`
            SELECT p.*, u.username as creatorName 
            FROM projects p
            LEFT JOIN users u ON p.createdBy = u.id
            ORDER BY p.createdAt DESC
        `);
        
        res.json(projects);
    } catch (error) {
        console.error('ошибка получения проектов:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

// создать проект (только админ)
export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = (req as any).user.id;

        console.log('проверка прав:', { userId, isAdmin: (req as any).user.isAdmin });
        
        console.log('создание проекта:', { name, description, userId });

        if (!name) {
            return res.status(400).json({ error: 'название проекта обязательно' });
        }

        const result = await db.run(
            'INSERT INTO projects (name, description, createdBy) VALUES (?, ?, ?)',
            [name, description || '', userId]
        );

        const project = await db.get(`
            SELECT p.*, u.username as creatorName 
            FROM projects p
            LEFT JOIN users u ON p.createdBy = u.id
            WHERE p.id = ?
        `, [result.lastID]);

        console.log('проект создан:', project);
        res.status(201).json(project);
    } catch (error) {
        console.error('ошибка создания проекта:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};