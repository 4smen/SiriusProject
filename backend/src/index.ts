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
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Middleware
app.use(cors());
app.use(express.json({
  limit: '10mb'
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Body:`, req.body);
  next();
});

app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`сервачок: http://localhost:${PORT}`);
        console.log(`и как он там поживает: http://localhost:${PORT}/api/health`);
    });
}).catch((err: any) => {
    console.error('Вот тут гад какой-то:', err);
});