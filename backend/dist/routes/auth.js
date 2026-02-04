"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Вход администратора
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        // Ищем администратора
        const admin = await db_1.db.get('SELECT * FROM admins WHERE username = ?', [username]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Проверяем пароль
        const isValidPassword = await bcryptjs_1.default.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Создаем JWT токен
        const token = jsonwebtoken_1.default.sign({ userId: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: admin.id,
                username: admin.username,
                isAdmin: true
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Проверка токена
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Проверяем, существует ли администратор
        const admin = await db_1.db.get('SELECT * FROM admins WHERE id = ?', [decoded.userId]);
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
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
