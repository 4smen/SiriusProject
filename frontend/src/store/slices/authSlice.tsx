import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

interface AuthUser {
    id: number;
    username: string;
    isAdmin: boolean;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

// Загружаем из localStorage при инициализации
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isLoading: false,
    error: null
};

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(credentials);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Ошибка входа');
        }
    }
);

export const verifyToken = createAsyncThunk(
    'auth/verify',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authAPI.verify();
            return response.data;
        } catch (error: any) {
            return rejectWithValue('Токен недействителен');
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Verify
            .addCase(verifyToken.fulfilled, (state, action) => {
                state.user = action.payload.user;
            })
            .addCase(verifyToken.rejected, (state) => {
                state.user = null;
                state.token = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
            });
    }
});

export const { clearError: clearAuthError } = authSlice.actions;
export default authSlice.reducer;