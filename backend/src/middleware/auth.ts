import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

//проверка токена администратора
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean };

        const admin = await db.get('SELECT * FROM admins WHERE id = ?', [decoded.userId]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        (req as any).user = {
            id: admin.id,
            username: admin.username,
            isAdmin: true
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};