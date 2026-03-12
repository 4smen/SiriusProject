import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { RootState } from '../../store';
import { tasksAPI } from '../../services/api';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import {
    Assignment as TaskIcon,
    CheckCircle as CompletedIcon,
    Edit as EditedIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

interface Stats {
    tasks: {
        total: number;
        completed: number;
        edited: number;
    };
    projects: number;
    users: number;
}

interface RecentTask {
    id: number;
    title: string;
    username: string;
    projectName: string;
    isCompleted: boolean;
    createdAt: string;
}

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const { tasks } = useSelector((state: RootState) => state.tasks);
    
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user?.isAdmin) {
        return null;
    }

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [statsResponse, tasksResponse] = await Promise.all([
                tasksAPI.getStats(),
                tasksAPI.getAll({ limit: 5, sortField: 'createdAt', sortOrder: 'DESC' })
            ]);

            setStats(statsResponse.data);
            
            const recent = (tasksResponse.data.data || []).map((task: any) => ({
                id: task.id,
                title: task.title,
                username: task.username,
                projectName: task.projectName,
                isCompleted: task.isCompleted,
                createdAt: task.createdAt
            }));
            
            setRecentTasks(recent);
            
        } catch (err: any) {
            console.error('ошибка загрузки статистики:', err);
            setError('не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'дата неизвестна';
        }
    };

    if (loading && !stats) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    панель администратора
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchStats}
                    disabled={loading}
                >
                    обновить
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        всего задач
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats?.tasks.total || 0}
                                    </Typography>
                                </Box>
                                <TaskIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        выполнено
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {stats?.tasks.completed || 0}
                                    </Typography>
                                </Box>
                                <CompletedIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        проекты
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats?.projects || 0}
                                    </Typography>
                                </Box>
                                <TaskIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        пользователи
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats?.users || 0}
                                    </Typography>
                                </Box>
                                <WarningIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            последние задачи
                        </Typography>
                        <List>
                            {recentTasks.length === 0 ? (
                                <ListItem>
                                    <ListItemText primary="нет задач" />
                                </ListItem>
                            ) : (
                                recentTasks.map((task, index) => (
                                    <React.Fragment key={task.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body1">
                                                            {task.title}
                                                        </Typography>
                                                        {task.isCompleted && (
                                                            <Chip
                                                                size="small"
                                                                label="выполнено"
                                                                color="success"
                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span">
                                                            {task.username} • {task.projectName}
                                                        </Typography>
                                                        <br />
                                                        <Typography variant="caption" color="textSecondary">
                                                            {formatDate(task.createdAt)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < recentTasks.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            задачи на модерации
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText primary="модерация задач вынесена в отдельный компонент" />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminPanel;