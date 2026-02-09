import axios from 'axios';
import { TaskCreateDTO, TaskUpdateDTO } from '../types/task';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Перехватчик для добавления токена
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обработка ошибок
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export const tasksAPI = {
    getTasks: (params: any) => api.get('/tasks', { params }),
    createTask: (taskData: TaskCreateDTO) => api.post('/tasks', taskData),
    updateTask: (id: number, updates: TaskUpdateDTO) => api.patch(`/tasks/${id}`, updates),
    getStats: () => api.get('/tasks/stats')
};

export const authAPI = {
    login: (credentials: { username: string; password: string }) =>
        api.post('/auth/login', credentials),
    verify: () => api.get('/auth/verify')
};

export default api;