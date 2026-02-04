"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Проверка токена администратора
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Проверяем, существует ли администратор
        const admin = await db_1.db.get('SELECT * FROM admins WHERE id = ?', [decoded.userId]);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = {
            id: admin.id,
            username: admin.username,
            isAdmin: true
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateAdmin = authenticateAdmin;
// Middleware для проверки, является ли пользователь администратором
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
