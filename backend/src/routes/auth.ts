import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'все поля обязательны' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'логин должен быть минимум 3 символа' });
        }

        if (password.length < 3) {
            return res.status(400).json({ error: 'пароль должен быть минимум 3 символа' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'некорректный email' });
        }

        const existing = await db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing) {
            return res.status(400).json({ error: 'пользователь с таким логином или email уже существует' });
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

        const user = await db.get(
            'SELECT id, username, email, isAdmin, createdAt FROM users WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json({
            token,
            user
        });

    } catch (error) {
        console.error('ошибка регистрации:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'логин и пароль обязательны' });
        }

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
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('ошибка входа:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
});

router.get('/verify', authenticate, async (req, res) => {
    try {
        const user = (req as any).user;
        res.json({
            isValid: true,
            user
        });
    } catch (error) {
        res.status(401).json({ error: 'недействительный токен' });
    }
});

router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = (req as any).user.id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'все поля обязательны' });
        }

        if (newPassword.length < 3) {
            return res.status(400).json({ error: 'новый пароль должен быть минимум 3 символа' });
        }

        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'неверный текущий пароль' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'пароль успешно изменён' });

    } catch (error) {
        console.error('ошибка смены пароля:', error);
        res.status(500).json({ error: 'внутренняя ошибка сервера' });
    }
});

router.get('/me', authenticate, (req, res) => {
    res.json((req as any).user);
});

export default router;