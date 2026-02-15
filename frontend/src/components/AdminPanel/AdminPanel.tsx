import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { tasksAPI } from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Task as TaskIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface Stats {
  total: number;
  completed: number;
  edited: number;
  recentTasks: any[];
}

const AdminPanel: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [statsResponse, tasksResponse] = await Promise.all([
        tasksAPI.getStats(),
        tasksAPI.getTasks({ limit: 5, sortField: 'createdAt', sortOrder: 'DESC' })
      ]);

      const recentTasks = (tasksResponse.data.data || []).map((task: any) => ({
        ...task,
        text: decodeIfNeeded(task.text),
        username: decodeIfNeeded(task.username),
        email: decodeIfNeeded(task.email)
      }));
      
      setStats({
        total: statsResponse.data.total || 0,
        completed: statsResponse.data.completed || 0,
        edited: statsResponse.data.edited || 0,
        recentTasks
      });
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const decodeIfNeeded = (text: string): string => {
    if (!text) return '';
    
    try {
      if (text.includes('\\u') || text.includes('&#')) {
        return decodeURIComponent(escape(text));
      }
      return text;
    } catch {
      return text;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Нет даты';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Некорректная дата';
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Ошибка даты';
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
        Требуются права администратора для доступа к этой панели
      </Alert>
    );
  }

  const completionRate = stats ? (stats.completed / stats.total * 100) || 0 : 0;
  const editedRate = stats ? (stats.edited / stats.total * 100) || 0 : 0;

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AdminIcon sx={{ mr: 2, fontSize: 30 }} color="primary" />
            <Typography variant="h5" component="h2">
              Панель администратора
            </Typography>
            <Tooltip title="Обновить">
              <IconButton 
                onClick={fetchStats} 
                sx={{ ml: 'auto' }}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" sx={{ mb: 2 }}>
            Последние задачи
          </Typography>
          
          {stats?.recentTasks && stats.recentTasks.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Пользователь</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Создана</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>{task.id}</TableCell>
                      <TableCell>{task.username}</TableCell>
                      <TableCell>{task.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={task.isCompleted ? 'Выполнена' : 'В работе'}
                          size="small"
                          color={task.isCompleted ? 'success' : 'default'}
                          variant={task.isEdited ? 'outlined' : 'filled'}
                        />
                        {task.isEdited && (
                          <Chip
                            label="Редакт."
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(task.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">Нет задач для отображения</Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/'}
            >
              К списку задач
            </Button>
            
            <Button
              variant="outlined"
              color="success"
              onClick={() => {
                const encoder = new TextEncoder();
                const dataStr = JSON.stringify(tasks, null, 2);
                const dataBlob = new Blob(['\uFEFF' + dataStr], { 
                  type: 'application/json;charset=utf-8' 
                });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'tasks_export.json';
                link.click();
              }}
            >
              Экспорт задач (UTF-8)
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminPanel;