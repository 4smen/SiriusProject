import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login, logout, verifyToken, clearAuthError } from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const auth = useSelector((state: RootState) => state.auth);

    return {
        user: auth.user,
        token: auth.token,
        isLoading: auth.isLoading,
        error: auth.error,
        isAdmin: auth.user?.isAdmin || false,
        isAuthenticated: !!auth.user,

        login: (username: string, password: string) =>
            dispatch(login({ username, password })),
        logout: () => dispatch(logout()),
        verify: () => dispatch(verifyToken()),
        clearError: () => dispatch(clearAuthError()),

        canEditTask: () => auth.user?.isAdmin || false,
        canDeleteTask: () => auth.user?.isAdmin || false,
        canCreateTask: () => true
    };
};