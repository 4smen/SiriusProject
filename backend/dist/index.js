"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const auth_1 = __importDefault(require("./routes/auth"));
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.use((0, cors_1.default)());
app.use(express_1.default.json({
    type: 'application/json; charset=utf-8',
    limit: '10mb'
}));

app.use('/api/tasks', tasks_1.default);
app.use('/api/auth', auth_1.default);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
//инициализация бд и запуск сервера
(0, db_1.initDB)().then(() => {
    app.listen(PORT, () => {
        console.log(`сервачок: http://localhost:${PORT}`);
        console.log(`и как он там поживает: http://localhost:${PORT}/api/health`);
    });
}).catch((err) => {
    console.error('Вот тут гад какой-то:', err);
});
