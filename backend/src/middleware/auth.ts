import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// проверка токена (для любых пользователей)
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'требуется авторизация' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean };

        const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);

        if (!user) {
            return res.status(401).json({ error: 'пользователь не найден' });
        }

        (req as any).user = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'недействительный токен' });
    }
};

// проверка прав администратора
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'требуются права администратора' });
    }

    next();
};