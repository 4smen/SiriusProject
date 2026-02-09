import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import { initDB } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  // Устанавливаем кодировку UTF-8 для всех ответов
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({
  limit: '10mb'
}));

// Add a debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Body:`, req.body);
  next();
});

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Инициализация БД и запуск сервера
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`сервачок: http://localhost:${PORT}`);
        console.log(`и как он там поживает: http://localhost:${PORT}/api/health`);
    });
}).catch((err: any) => {
    console.error('Вот тут гад какой-то:', err);
});