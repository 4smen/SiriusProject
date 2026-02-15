import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

//вход администратора
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        //JWT токен
        const token = jwt.sign(
            { userId: admin.id, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: admin.id,
                username: admin.username,
                isAdmin: true
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//проверка токена
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean };

        const admin = await db.get('SELECT * FROM admins WHERE id = ?', [decoded.userId]);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({
            isValid: true,
            user: {
                id: admin.id,
                username: admin.username,
                isAdmin: true
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;