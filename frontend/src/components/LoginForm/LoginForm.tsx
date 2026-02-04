import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, verifyToken } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import {
    Box,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Alert,
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    Login as LoginIcon,
    Logout as LogoutIcon,
    Close as CloseIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const LoginForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

    // Проверяем токен при загрузке компонента
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !user) {
            console.log('Checking stored token...');
            dispatch(verifyToken());
        }
    }, [dispatch, user]);

    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await dispatch(login({ username, password }));

        if (login.fulfilled.match(result)) {
            setOpen(false);
            setUsername('');
            setPassword('');
        }
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleClose = () => {
        setOpen(false);
        setUsername('');
        setPassword('');
    };

    return (
        <>
            {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <AdminIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                        {user.username}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                        size="small"
                        color="inherit"
                    >
                        Выйти
                    </Button>
                </Box>
            ) : (
                <Button
                    variant="outlined"
                    onClick={() => setOpen(true)}
                    startIcon={<LoginIcon />}
                    size="small"
                    color="inherit"
                >
                    Войти
                </Button>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <form onSubmit={handleLogin}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Вход администратора
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            autoFocus
                            margin="dense"
                            label="Логин"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            margin="dense"
                            label="Пароль"
                            type="password"
                            fullWidth
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Тестовый аккаунт: admin / 123
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleClose} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || !username || !password}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                        >
                            {isLoading ? 'Вход...' : 'Войти'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

export default LoginForm;