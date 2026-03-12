import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taskRequestsAPI } from '../../services/api';
import { TaskRequest, TaskRequestCreateDTO } from '../../types/task';

interface TaskRequestsState {
    pendingRequests: TaskRequest[];
    loading: boolean;
    error: string | null;
}

const initialState: TaskRequestsState = {
    pendingRequests: [],
    loading: false,
    error: null
};

export const fetchPendingRequests = createAsyncThunk(
    'taskRequests/fetchPending',
    async (_, { rejectWithValue }) => {
        try {
            const response = await taskRequestsAPI.getPending();
            return response.data as TaskRequest[];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка загрузки запросов');
        }
    }
);

export const createTaskRequest = createAsyncThunk(
    'taskRequests/create',
    async (data: TaskRequestCreateDTO, { rejectWithValue }) => {
        try {
            const response = await taskRequestsAPI.create(data);
            return response.data as TaskRequest;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка создания запроса');
        }
    }
);

export const approveRequest = createAsyncThunk(
    'taskRequests/approve',
    async ({ id, deadline }: { id: number; deadline?: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await taskRequestsAPI.approve(id, deadline);
            await dispatch(fetchPendingRequests());
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка утверждения');
        }
    }
);

export const rejectRequest = createAsyncThunk(
    'taskRequests/reject',
    async (id: number, { rejectWithValue, dispatch }) => {
        try {
            const response = await taskRequestsAPI.reject(id);
            await dispatch(fetchPendingRequests());
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка отклонения');
        }
    }
);

const taskRequestsSlice = createSlice({
    name: 'taskRequests',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPendingRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingRequests = action.payload;
            })
            .addCase(fetchPendingRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createTaskRequest.fulfilled, (state, action) => {
                if (action.payload.status === 'pending') {
                    state.pendingRequests.push(action.payload);
                }
            });
    }
});

export default taskRequestsSlice.reducer;