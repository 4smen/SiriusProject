import axios from 'axios';
import { 
    LoginCredentials, 
    RegisterCredentials,
    TaskRequestCreateDTO,
    ProjectCreateDTO 
} from '../types/task';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

console.log('api.ts инициализация, API_URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

api.interceptors.request.use(config => {
    console.log('запрос:', config.method?.toUpperCase(), config.url);
    console.log('заголовки:', config.headers);
    console.log('данные:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('токен добавлен');
    } else {
        console.log('токена нет');
    }
    return config;
});

api.interceptors.response.use(
    response => {
        console.log('ответ:', response.status, response.config.url);
        console.log('данные:', response.data);
        return response;
    },
    error => {
        console.log('ошибка запроса:', error.config?.url);
        
        if (error.code === 'ECONNABORTED') {
            console.log('   таймаут запроса');
        } else if (error.response) {
            console.log('статус:', error.response.status);
            console.log('данные ошибки:', error.response.data);
            console.log('заголовки:', error.response.headers);
            
            if (error.response.status === 401) {
                console.log('401 ошибка, очищаем localStorage');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } else if (error.request) {
            console.log('нет ответа от сервера');
            console.log('запрос:', error.request);
        } else {
            console.log('ошибка настройки запроса:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials: LoginCredentials) => {
        console.log('попытка входа:', credentials.username);
        return api.post('/auth/login', credentials);
    },
    register: (credentials: RegisterCredentials) => {
        console.log('попытка регистрации:', credentials.username);
        return api.post('/auth/register', credentials);
    },
    verify: () => {
        console.log('проверка токена');
        return api.get('/auth/verify');
    }
};

export const projectsAPI = {
    getAll: () => {
        console.log('загрузка проектов');
        return api.get('/projects');
    },
    create: (data: ProjectCreateDTO) => {
        console.log('создание проекта:', data.name);
        return api.post('/projects', data);
    }
};

export const taskRequestsAPI = {
    create: (data: TaskRequestCreateDTO) => {
        console.log('создание запроса на задачу');
        return api.post('/task-requests', data);
    },
    getPending: () => {
        console.log('загрузка ожидающих запросов');
        return api.get('/task-requests/pending');
    },
    approve: (id: number, deadline?: string) => {
    console.log('утверждение запроса:', id, 'с дедлайном:', deadline);
    return api.post(`/task-requests/${id}/approve`, { deadline });
    },
    reject: (id: number) => {
        console.log('отклонение запроса:', id);
        return api.post(`/task-requests/${id}/reject`);
    }
};

export const tasksAPI = {
    getAll: (params?: any) => {
        console.log('загрузка задач', params);
        return api.get('/tasks', { params });
    },
    update: (id: number, updates: any) => {
        console.log('обновление задачи:', id, updates);
        return api.patch(`/tasks/${id}`, updates);
    },
    getStats: () => {
        console.log('загрузка статистики');
        return api.get('/tasks/stats');
    }
};

export default api;