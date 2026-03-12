// frontend/src/App.tsx
import React, { useEffect, useRef } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState, AppDispatch } from './store';
import TaskList from './components/TaskList/TaskList';
import TaskRequestForm from './components/TaskRequestForm/TaskRequestForm';
import ProjectForm from './components/ProjectForm/ProjectForm';
import LoginForm from './components/LoginForm/LoginForm';
import AdminModeration from './components/AdminModeration/AdminModeration';
import { verifyToken } from './store/slices/authSlice';
import { fetchProjects } from './store/slices/projectsSlice';
import {
    Container,
    Box,
    Typography,
    AppBar,
    Toolbar,
    CssBaseline,
    Paper,
    CircularProgress
} from '@mui/material';
import { Task as TaskIcon } from '@mui/icons-material';

const AppContent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading, isVerified } = useSelector((state: RootState) => state.auth);
    
    // используем ref для предотвращения множественных вызовов
    const initializedRef = useRef(false);

    // проверка токена - только один раз
    useEffect(() => {
        // если уже инициализировали - выходим
        if (initializedRef.current) return;
        
        const token = localStorage.getItem('token');
        
        const init = async () => {
            if (token) {
                await dispatch(verifyToken());
            }
            initializedRef.current = true;
        };
        
        init();
        
    }, [dispatch]); // ← только dispatch в зависимостях

    // загрузка проектов - только когда есть пользователь
    useEffect(() => {
        if (user) {
            dispatch(fetchProjects());
        }
    }, [user, dispatch]); // ← user и dispatch

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
                    загрузка приложения...
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
                        task manager
                    </Typography>
                    <LoginForm />
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {user ? (
                    <>
                        {user.isAdmin && <ProjectForm />}
                        <TaskRequestForm />
                    </>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom>
                            добро пожаловать!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            войдите или зарегистрируйтесь, чтобы создавать задачи
                        </Typography>
                    </Paper>
                )}

                <TaskList />
            </Container>

            <AdminModeration />
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