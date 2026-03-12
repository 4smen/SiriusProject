import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login, logout, verifyToken, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, token, isLoading, error, isVerified } = useSelector((state: RootState) => state.auth);

    const handleLogin = async (username: string, password: string) => {
        return await dispatch(login({ username, password })).unwrap();
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleVerifyToken = () => {
        dispatch(verifyToken());
    };

    const handleClearError = () => {
        dispatch(clearError());
    };

    return {
        user,
        token,
        isLoading,
        error,
        isVerified,
        isAdmin: user?.isAdmin || false,
        login: handleLogin,
        logout: handleLogout,
        verifyToken: handleVerifyToken,
        clearError: handleClearError
    };
};