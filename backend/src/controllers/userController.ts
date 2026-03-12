import { Request, Response } from 'express';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// регистрация обычного пользователя
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, email } = req.body;

        // проверка на существование
        const existing = await db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing) {
            return res.status(400).json({ error: 'пользователь с таким именем или email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (username, password, email, isAdmin) VALUES (?, ?, ?, 0)',
            [username, hashedPassword, email]
        );

        const token = jwt.sign(
            { userId: result.lastID, isAdmin: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.lastID,
                username,
                email,
                isAdmin: false
            }
        });
    } catch (error) {
        console.error('ошибка регистрации:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};

// вход (работает и для админов, и для обычных пользователей)
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await db.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'неверные учетные данные' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'неверные учетные данные' });
        }

        const token = jwt.sign(
            { userId: user.id, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('ошибка входа:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
};