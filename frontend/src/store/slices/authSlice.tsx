// frontend/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '../../types/task';

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isLoading: false,
    error: null,
    isVerified: false
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(credentials);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка входа');
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (credentials: RegisterCredentials, { rejectWithValue }) => {
        try {
            const response = await authAPI.register(credentials);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка регистрации');
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
            return rejectWithValue('токен недействителен');
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
                state.isVerified = true;
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isVerified = false;
            })
            
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isVerified = true;
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isVerified = false;
            })

            // Verify
            .addCase(verifyToken.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(verifyToken.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isVerified = true;
            })
            .addCase(verifyToken.rejected, (state) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
                state.isVerified = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // ⚠️ НЕ делаем редирект здесь!
                // Просто очищаем состояние, компоненты сами обновятся
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isVerified = false;
            });
    }
});

export const { clearError } = authSlice.actions;  // ←注意: clearError, а не clearAuthError
export default authSlice.reducer;