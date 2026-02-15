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
    isVerified: boolean;
}

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
    async (_, { rejectWithValue, getState }) => {
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

            .addCase(verifyToken.fulfilled, (state, action) => {
                const newUser = action.payload.user;
                const currentUser = state.user;

                if (!currentUser || 
                    currentUser.id !== newUser.id || 
                    currentUser.username !== newUser.username ||
                    currentUser.isAdmin !== newUser.isAdmin) {
                    state.user = newUser;
                }
                
                state.isVerified = true;
            })
            .addCase(verifyToken.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.isVerified = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isVerified = false;
            });
    }
});

export const { clearError: clearAuthError } = authSlice.actions;
export default authSlice.reducer;