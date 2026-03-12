// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tasksReducer from './slices/taskSlice';
import projectsReducer from './slices/projectsSlice';
import taskRequestsReducer from './slices/taskRequestsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: tasksReducer,
        projects: projectsReducer,
        taskRequests: taskRequestsReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;