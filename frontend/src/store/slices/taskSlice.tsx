import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksAPI } from '../../services/api';
import { ITask, TasksResponse, TaskFilters, TaskCreateDTO, TaskUpdateDTO } from '../../types/task';

interface TasksState {
    tasks: ITask[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    };
    filters: TaskFilters;
    loading: boolean;
    error: string | null;
}

const initialState: TasksState = {
    tasks: [],
    pagination: {
        total: 0,
        page: 1,
        totalPages: 1,
        limit: 3
    },
    filters: {
        page: 1,
        limit: 3,
        sortField: 'createdAt',
        sortOrder: 'DESC'
    },
    loading: false,
    error: null
};

export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (params: Partial<TaskFilters>, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.getTasks(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Ошибка загрузки задач');
        }
    }
);

export const createTask = createAsyncThunk(
    'tasks/createTask',
    async (taskData: TaskCreateDTO, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.createTask(taskData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Ошибка создания задачи');
        }
    }
);

export const updateTask = createAsyncThunk(
    'tasks/updateTask',
    async ({ id, updates }: { id: number; updates: TaskUpdateDTO }, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.updateTask(id, updates);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Ошибка обновления задачи');
        }
    }
);

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.filters.page = action.payload;
        },
        setSort: (state, action: PayloadAction<{ field: TaskFilters['sortField']; order: TaskFilters['sortOrder'] }>) => {
            state.filters.sortField = action.payload.field;
            state.filters.sortOrder = action.payload.order;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create task
            .addCase(createTask.pending, (state) => {
                state.error = null;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.tasks = [action.payload, ...state.tasks];
                state.pagination.total += 1;
            })
            .addCase(createTask.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // Update task
            .addCase(updateTask.pending, (state) => {
                state.error = null;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(task => task.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    }
});

export const { setFilters, setPage, setSort, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;