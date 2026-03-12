import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fade,
  Grow,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  MoreTime as MoreTimeIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';

interface Anomaly {
  id: number;
  task_id: number;
  username: string;
  task_text: string;
  active_hours: number;
  estimated_hours: number;
  deviation: number;
  detected_at: string;
  is_resolved: boolean;
}

interface Notification {
  id: number;
  anomaly: Anomaly;
  read: boolean;
  timestamp: Date;
}

const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AiAnomalies: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [lastAnomaly, setLastAnomaly] = useState<Anomaly | null>(null);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    if (isAdmin && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAdmin]);

  const fetchAnomalies = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const response = await api.get('/api/tasks/anomalies');
      const newAnomalies = Array.isArray(response.data) ? response.data : [];
      
      setAnomalies(prev => {
        const validNewOnes = newAnomalies.filter((a: Anomaly) => a && a.id);
        const newOnes = validNewOnes.filter(
          (a: Anomaly) => !prev.some(p => p && p.id === a.id)
        );
        
        return newAnomalies;
      });
      
      setError(null);
    } catch (err: any) {
      console.error('ошибка загрузки аномалий:', err);
      if (err.response?.status === 401) {
        setError('ошибка авторизации');
      }
    }
  }, [isAdmin]);

  const handleCompleteTask = async (anomalyId: number, taskId: number) => {
    try {
      setLoading(true);
      const response = await api.post(`/api/tasks/anomalies/${anomalyId}/complete`);
      setAnomalies(response.data.anomalies);
      setLastAnomaly({
        id: 0,
        task_id: 0,
        username: 'система',
        task_text: 'задача выполнена',
        active_hours: 0,
        estimated_hours: 0,
        deviation: 0,
        detected_at: "",
        is_resolved: true
      });
      setSnackbarOpen(true);
    } catch (err) {
      setError('не удалось выполнить задачу');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAllTasks = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/tasks/anomalies/check-all');
      await fetchAnomalies();
      setLastAnomaly({
        id: 0,
        task_id: 0,
        username: 'система',
        task_text: `найдено ${response.data.anomalies?.length || 0} аномалий`,
        active_hours: 0,
        estimated_hours: 0,
        deviation: 0,
        detected_at: "",
        is_resolved: true
      });
      setSnackbarOpen(true);
    } catch (err) {
      setError('ошибка при проверке задач');
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

  useEffect(() => {
    if (isAdmin) {
      fetchAnomalies();
      const interval = setInterval(fetchAnomalies, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAnomalies]);

  if (!isAdmin) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {notifications.length > 0 && (
        <Fade in={!isOpen}>
          <Paper
            sx={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              width: 320,
              maxHeight: 400,
              overflow: 'auto',
              zIndex: 1250,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">
                уведомления ({unreadCount})
              </Typography>
              <IconButton size="small" sx={{ color: 'white' }} onClick={() => setNotifications([])}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <List dense>
              {notifications.slice(0, 3).map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setNotifications(prev =>
                      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                    );
                    setIsOpen(true);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light', width: 32, height: 32 }}>
                      <WarningIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {notification.anomaly?.username || 'неизвестно'}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary" noWrap>
                        {notification.anomaly?.task_text || 'нет описания'}
                      </Typography>
                    }
                  />
                  <Chip
                    size="small"
                    label={`${notification.anomaly?.deviation?.toFixed(1) || '?'}x`}
                    color="error"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Fade>
      )}

      {(
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 450,
            maxHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon />
                <Typography variant="h6">ai ассистент</Typography>
                <Chip 
                  label={`${anomalies.length} активных`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              {/* <Box display="flex" gap={1}>
                <Tooltip title="обновить">
                  <IconButton size="small" sx={{ color: 'white' }} onClick={fetchAnomalies}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="закрыть">
                  <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box> */}
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
            {loading && anomalies.length === 0 ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : anomalies.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography>аномалий не обнаружено</Typography>
              </Box>
            ) : (
              anomalies.map((anomaly) => (
                <Paper key={anomaly.id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Avatar sx={{ bgcolor: 'error.light' }}>
                      <PersonIcon />
                    </Avatar>
                    
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {anomaly.username}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {anomaly.task_text}
                      </Typography>

                      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                        <Chip
                          icon={<ScheduleIcon />}
                          label={anomaly.active_hours}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<SpeedIcon />}
                          label={anomaly.estimated_hours}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<MoreTimeIcon />}
                          label={`${anomaly.deviation?.toFixed(1) || '?'}x`}
                          color="error"
                          size="small"
                        />
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(anomaly.detected_at)}
                        </Typography>
                        
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleCompleteTask(anomaly.id, anomaly.task_id)}
                          >
                            выполнить
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={handleCheckAllTasks}
              disabled={loading}
            >
              проверить все задачи
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={lastAnomaly?.is_resolved ? "success" : "error"} variant="filled">
          {lastAnomaly?.task_text || 'действие выполнено'}
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

export default AiAnomalies;