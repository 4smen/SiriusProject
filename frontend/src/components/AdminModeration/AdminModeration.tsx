import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchPendingRequests, 
    approveRequest, 
    rejectRequest 
} from '../../store/slices/taskRequestsSlice';
import { AppDispatch, RootState } from '../../store';
import { 
    Box, 
    Paper, 
    Typography, 
    IconButton, 
    Badge,
    List,
    Button,
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Fade,
    Divider,
    Card,
    CardContent,
    CardActions,
    TextField
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Assignment as TaskIcon,
    Folder as FolderIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 15px rgba(244, 67, 54, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
`;

const PulsingBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        animation: `${pulseAnimation} 1.5s infinite`,
        fontSize: '1rem',
        height: 24,
        minWidth: 24,
    },
}));

const AdminModeration: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const { user } = useSelector((state: RootState) => state.auth);
    const { pendingRequests, loading: requestsLoading } = useSelector((state: RootState) => state.taskRequests);

    const fetchRequests = useCallback(async () => {
        if (!user?.isAdmin) return;

        try {
            await dispatch(fetchPendingRequests()).unwrap();
        } catch (err: any) {
            console.error('ошибка загрузки запросов:', err);
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchRequests();
            const interval = setInterval(fetchRequests, 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchRequests]);

    const handleApprove = async (id: number) => {
        setLoading(true);
        try {
            const deadline = editingDeadline[id];
            await dispatch(approveRequest({ id, deadline })).unwrap();
            setSnackbarMessage('запрос утверждён, задача создана');
            setSnackbarOpen(true);
        } catch (err: any) {
            setError('ошибка при утверждении запроса');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: number) => {
        setLoading(true);
        try {
            await dispatch(rejectRequest(id)).unwrap();
            setSnackbarMessage('запрос отклонён');
            setSnackbarOpen(true);
        } catch (err: any) {
            setError('ошибка при отклонении запроса');
        } finally {
            setLoading(false);
        }
    };

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

    const [editingDeadline, setEditingDeadline] = useState<{ [key: number]: string }>({});

    const handleDeadlineChange = (requestId: number, value: string) => {
        setEditingDeadline(prev => ({ ...prev, [requestId]: value }));
    };

    const handleApproveWithDeadline = async (requestId: number) => {
        setLoading(true);
        try {
            const deadline = editingDeadline[requestId];
            await dispatch(approveRequest({ id: requestId, deadline })).unwrap();
            setSnackbarMessage('запрос утверждён, задача создана');
            setSnackbarOpen(true);
        } catch (err: any) {
            setError('ошибка при утверждении запроса');
        } finally {
            setLoading(false);
        }
    };

    if (!user?.isAdmin) {
        return null;
    }

    return (
        <>
            <Tooltip title="модерация задач">
                <PulsingBadge
                    badgeContent={pendingRequests.length}
                    color="error"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1200,
                    }}
                >
                    <IconButton
                        onClick={() => setIsOpen(!isOpen)}
                        sx={{
                            bgcolor: isOpen ? 'error.main' : 'primary.main',
                            color: 'white',
                            width: 56,
                            height: 56,
                            '&:hover': {
                                bgcolor: isOpen ? 'error.dark' : 'primary.dark',
                            },
                            boxShadow: 3,
                        }}
                    >
                        {requestsLoading ? <CircularProgress size={24} color="inherit" /> : <AdminIcon />}
                    </IconButton>
                </PulsingBadge>
            </Tooltip>

            {isOpen && (
                <Paper
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 500,
                        maxHeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1300,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1}>
                                <TaskIcon />
                                <Typography variant="h6">модерация задач</Typography>
                                <Chip 
                                    label={`${pendingRequests.length} ожидают`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                />
                            </Box>
                            <Box display="flex" gap={1}>
                                <Tooltip title="закрыть">
                                    <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsOpen(false)}>
                                        <CloseIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                        {requestsLoading && pendingRequests.length === 0 ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : pendingRequests.length === 0 ? (
                            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                <Typography>нет запросов на модерацию</Typography>
                            </Box>
                        ) : (
                                pendingRequests.map((request) => (
                                <Card key={request.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <PersonIcon fontSize="small" color="action" />
                                            <Typography variant="subtitle2">
                                                {request.username} ({request.userEmail})
                                            </Typography>
                                        </Box>
                        
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <Typography variant="body2" color="primary">
                                                {request.projectName}
                                            </Typography>
                                        </Box>

                                        <Typography variant="h6" gutterBottom>
                                            {request.title}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                                            {request.description}
                                        </Typography>

                                        {request.deadline && (
                                            <Box display="flex" alignItems="center" gap={0.5} mt={1} mb={2}>
                                                <CalendarIcon fontSize="small" color="action" />
                                                <Typography 
                                                    variant="body2" 
                                                    color={new Date(request.deadline) < new Date() ? 'error' : 'text.secondary'}
                                                >
                                                    дедлайн: {new Date(request.deadline).toLocaleString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Typography>
                                                {new Date(request.deadline) < new Date() && (
                                                    <Chip 
                                                        size="small" 
                                                        label="просрочен" 
                                                        color="error" 
                                                        sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        )}

                                        <Typography variant="caption" color="text.secondary">
                                            создано: {formatDate(request.createdAt)}
                                        </Typography>
                                        <Box sx={{ mt: 2, mb: 2 }}>
                                            <TextField
                                                type="date"
                                                size="small"
                                                label="установить дедлайн"
                                                value={editingDeadline[request.id] || (request.deadline ? request.deadline.split('T')[0] : '')}
                                                onChange={(e) => handleDeadlineChange(request.id, e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{
                                                    min: new Date().toISOString().split('T')[0]
                                                }}
                                                fullWidth
                                                disabled={loading}
                                            />
                                        </Box>
                                    </CardContent>

                                    <CardActions sx={{ justifyContent: 'flex-end', gap: 1, p: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<CancelIcon />}
                                            onClick={() => handleReject(request.id)}
                                            disabled={loading}
                                        >
                                            отклонить
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => handleApprove(request.id)}
                                            disabled={loading}
                                        >
                                            утвердить
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))
                        )}
                    </Box>
                </Paper>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert severity="success" variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert severity="error" variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AdminModeration;