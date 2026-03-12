import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import routes from './routes';  // ← импорт всех маршрутов

const app = express();
const PORT = process.env.PORT || 5001;

// мидлвары
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// все маршруты API
app.use('/api', routes);  // ← все маршруты начинаются с /api

// тестовый маршрут
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// обработка 404
app.use('*', (req, res) => {
    console.log('404 для пути:', req.originalUrl);
    res.status(404).json({ error: 'маршрут не найден' });
});

// обработка ошибок
app.use((err: any, req: any, res: any, next: any) => {
    console.error('ошибка сервера:', err);
    res.status(500).json({ error: 'внутренняя ошибка сервера' });
});

// инициализация базы данных и запуск сервера
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`сервер запущен на порту ${PORT}`);
        console.log(`API доступно по адресу http://localhost:${PORT}/api`);
        console.log(`маршруты:`);
        console.log(`   - POST /api/auth/login`);
        console.log(`   - GET  /api/tasks`);
        console.log(`   - GET  /api/projects`);
        console.log(`   - POST /api/projects`);
        console.log(`   - GET  /api/task-requests/pending`);
    });
}).catch(error => {
    console.error('❌ ошибка инициализации БД:', error);
});