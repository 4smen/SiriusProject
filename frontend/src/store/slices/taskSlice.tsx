// frontend/src/store/slices/taskSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksAPI } from '../../services/api';
import { Task, PaginatedResponse, PaginationParams } from '../../types/task';

interface TasksState {
    tasks: Task[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    };
    filters: {
        page: number;
        limit: number;
        sortField: string;
        sortOrder: 'ASC' | 'DESC';
    };
    loading: boolean;
    error: string | null;
}

const initialState: TasksState = {
    tasks: [],
    pagination: {
        total: 0,
        page: 1,
        totalPages: 1,
        limit: 10
    },
    filters: {
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'DESC'
    },
    loading: false,
    error: null
};

export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (params: Partial<PaginationParams>, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.getAll(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка загрузки задач');
        }
    }
);

export const updateTask = createAsyncThunk(
    'tasks/updateTask',
    async ({ id, updates }: { id: number; updates: any }, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.update(id, updates);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка обновления задачи');
        }
    }
);

// ⚠️ ВНИМАНИЕ: createTask больше не используется!
// Теперь задачи создаются через запросы (task-requests)

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.filters.page = action.payload;
        },
        setSort: (state, action: PayloadAction<{ field: string; order: 'ASC' | 'DESC' }>) => {
            state.filters.sortField = action.payload.field;
            state.filters.sortOrder = action.payload.order;
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
            .addCase(updateTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            });
    }
});

export const { setFilters, setPage, setSort } = tasksSlice.actions;
export default tasksSlice.reducer;