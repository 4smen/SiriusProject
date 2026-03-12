import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, logout } from '../../store/slices/authSlice';
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
    Avatar,
    Tab,
    Tabs
} from '@mui/material';
import {
    Login as LoginIcon,
    Logout as LogoutIcon,
    Close as CloseIcon,
    PersonAdd as RegisterIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon
} from '@mui/icons-material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
};

const LoginForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regError, setRegError] = useState<string | null>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setRegError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await dispatch(login({ 
            username: loginUsername, 
            password: loginPassword 
        }));

        if (login.fulfilled.match(result)) {
            handleClose();
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError(null);

        if (regPassword !== regConfirmPassword) {
            setRegError('пароли не совпадают');
            return;
        }

        if (regPassword.length < 3) {
            setRegError('пароль должен быть минимум 3 символа');
            return;
        }

        const result = await dispatch(register({ 
            username: regUsername, 
            password: regPassword,
            email: regEmail 
        }));

        if (register.fulfilled.match(result)) {
            handleClose();
        }
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleClose = () => {
        setOpen(false);
        setTabValue(0);
        setLoginUsername('');
        setLoginPassword('');
        setRegUsername('');
        setRegPassword('');
        setRegEmail('');
        setRegConfirmPassword('');
        setRegError(null);
    };

    return (
        <>
            {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: user.isAdmin ? 'error.main' : 'primary.main' }}>
                        {user.isAdmin ? <AdminIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
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
                        выйти
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
                    вход / регистрация
                </Button>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                {/* остальная часть без изменений */}
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ minHeight: 40 }}>
                        <Tab label="вход" sx={{ minHeight: 40 }} />
                        <Tab label="регистрация" sx={{ minHeight: 40 }} />
                    </Tabs>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    {error && tabValue === 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {regError && tabValue === 1 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {regError}
                        </Alert>
                    )}

                    <TabPanel value={tabValue} index={0}>
                        <form onSubmit={handleLogin}>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="логин"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                required
                                disabled={isLoading}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="dense"
                                label="пароль"
                                type="password"
                                fullWidth
                                variant="outlined"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />

                            <DialogActions sx={{ px: 0, pt: 2 }}>
                                <Button onClick={handleClose} disabled={isLoading}>
                                    отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isLoading || !loginUsername || !loginPassword}
                                    startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                                >
                                    {isLoading ? 'вход...' : 'войти'}
                                </Button>
                            </DialogActions>
                        </form>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <form onSubmit={handleRegister}>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="логин"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                required
                                disabled={isLoading}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="dense"
                                label="email"
                                type="email"
                                fullWidth
                                variant="outlined"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="dense"
                                label="пароль"
                                type="password"
                                fullWidth
                                variant="outlined"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="dense"
                                label="подтверждение пароля"
                                type="password"
                                fullWidth
                                variant="outlined"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                error={regPassword !== regConfirmPassword && regConfirmPassword !== ''}
                                helperText={
                                    regPassword !== regConfirmPassword && regConfirmPassword !== '' 
                                        ? 'пароли не совпадают' 
                                        : ''
                                }
                            />

                            <DialogActions sx={{ px: 0, pt: 2 }}>
                                <Button onClick={handleClose} disabled={isLoading}>
                                    отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isLoading || !regUsername || !regPassword || !regEmail || regPassword !== regConfirmPassword}
                                    startIcon={isLoading ? <CircularProgress size={20} /> : <RegisterIcon />}
                                >
                                    {isLoading ? 'регистрация...' : 'зарегистрироваться'}
                                </Button>
                            </DialogActions>
                        </form>
                    </TabPanel>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default LoginForm;