import React, { useCallback, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState, AppDispatch } from './store';
import TaskList from './components/TaskList/TaskList';
import AddTaskForm from './components/AddTaskForm/AddTaskForm';
import LoginForm from './components/LoginForm/LoginForm';
import { verifyToken } from './store/slices/authSlice';
import {
    Container,
    Box,
    Typography,
    AppBar,
    Toolbar,
    CssBaseline
} from '@mui/material';
import { Task as TaskIcon } from '@mui/icons-material';

// Главный компонент без Provider
const AppContent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static">
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
                    <Box sx={{ mt: 4, p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Режим администратора
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Вы вошли как администратор ({user.username}). Можете редактировать задачи и отмечать их как выполненные.
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

// Обертка с Provider
const App: React.FC = () => {
    return (
        <Provider store={store}>
            <CssBaseline />
            <AppContent />
        </Provider>
    );
};

export default App;