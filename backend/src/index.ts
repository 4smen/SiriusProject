import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
    console.log('404 для пути:', req.originalUrl);
    res.status(404).json({ error: 'маршрут не найден' });
});

app.use((err: any, req: any, res: any, next: any) => {
    console.error('ошибка сервера:', err);
    res.status(500).json({ error: 'внутренняя ошибка сервера' });
});

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