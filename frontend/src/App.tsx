import React, { useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState, AppDispatch } from './store';
import TaskList from './components/TaskList/TaskList';
import AddTaskForm from './components/AddTaskForm/AddTaskForm';
import LoginForm from './components/LoginForm/LoginForm';
import AIAnomalies from './components/AiAnomalies/AiAnomalies';
import { verifyToken } from './store/slices/authSlice';
import {
    Container,
    Box,
    Typography,
    AppBar,
    Toolbar,
    CssBaseline,
    Paper,
    Chip,
    CircularProgress
} from '@mui/material';
import { Task as TaskIcon, Warning as WarningIcon } from '@mui/icons-material';

const AppContent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading, isVerified } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        let isMounted = true;
        
        const verify = async () => {
            if (isMounted) {
                await dispatch(verifyToken());
            }
        };
        
        const token = localStorage.getItem('token');
        if (token && !isVerified) {
            verify();
        }
        
        return () => {
            isMounted = false;
        };
    }, [dispatch, isVerified]);

    if (isLoading && !isVerified) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                gap: 2
            }}>
                <CircularProgress />
                <Typography variant="body1" color="text.secondary">
                    Загрузка приложения...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <TaskIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Task Manager
                    </Typography>
                    
                    <LoginForm />
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <AddTaskForm />
                <TaskList />

                {user?.isAdmin && (
                    <Paper 
                        elevation={0}
                        sx={{ 
                            mt: 4, 
                            p: 3, 
                            bgcolor: 'primary.light',
                            color: 'white',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <WarningIcon sx={{ fontSize: 32 }} />
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                                Панель администратора
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                Вы вошли как {user.username}. AI-ассистент отслеживает 
                                аномалии времени выполнения задач.
                            </Typography>
                        </Box>
                    </Paper>
                )}
            </Container>

            <AIAnomalies />
        </Box>
    );
};

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <CssBaseline />
            <AppContent />
        </Provider>
    );
};

export default App;