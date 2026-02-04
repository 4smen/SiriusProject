import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';
import { ITask } from '../../types/task';
import {
    Card,
    CardContent,
    Typography,
    Checkbox,
    IconButton,
    TextField,
    Box,
    Chip,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Edit,
    Save,
    Cancel,
    CheckCircle,
    RadioButtonUnchecked,
    DoneAll,
    AccessTime
} from '@mui/icons-material';

interface TaskItemProps {
    task: ITask;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(task.text);
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const isAdmin = user?.isAdmin || false;

    const handleStatusChange = async () => {
        if (!isAdmin) return;

        try {
            await dispatch(updateTask({
                id: task.id,
                updates: { isCompleted: !task.isCompleted }
            })).unwrap();

            showNotification(
                task.isCompleted ? 'Задача возвращена в работу' : 'Задача выполнена!',
                'success'
            );
        } catch (error) {
            showNotification('Ошибка обновления статуса', 'error');
        }
    };

    const handleSaveEdit = async () => {
        if (editedText.trim() === task.text) {
            setIsEditing(false);
            return;
        }

        try {
            await dispatch(updateTask({
                id: task.id,
                updates: { text: editedText }
            })).unwrap();

            setIsEditing(false);
            showNotification('Задача обновлена', 'success');
        } catch (error) {
            showNotification('Ошибка сохранения', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditedText(task.text);
        setIsEditing(false);
    };

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Card sx={{
                mb: 2,
                borderLeft: task.isCompleted ? '4px solid #4caf50' : '4px solid #2196f3',
                opacity: task.isCompleted ? 0.9 : 1,
                transition: 'all 0.3s ease'
            }}>
                <CardContent>
                    {/* Заголовок с пользователем */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box>
                            <Typography variant="h6" component="div" fontWeight="bold">
                                {task.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {task.email}
                            </Typography>
                        </Box>

                        <Box display="flex" gap={1} alignItems="center">
                            {task.isEdited && (
                                <Chip
                                    label="Редакт."
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                            )}
                            {task.isCompleted && (
                                <Chip
                                    label="Готово"
                                    size="small"
                                    color="success"
                                    icon={<DoneAll fontSize="small" />}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* Текст задачи */}
                    {isEditing ? (
                        <Box display="flex" gap={1} mb={2} alignItems="flex-start">
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                size="small"
                                variant="outlined"
                                autoFocus
                            />
                            <Box display="flex" flexDirection="column" gap={0.5}>
                                <Tooltip title="Сохранить">
                                    <IconButton
                                        onClick={handleSaveEdit}
                                        color="primary"
                                        size="small"
                                        disabled={editedText.trim() === ''}
                                    >
                                        <Save />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Отмена">
                                    <IconButton onClick={handleCancelEdit} color="error" size="small">
                                        <Cancel />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    ) : (
                        <Typography
                            variant="body1"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                color: task.isCompleted ? 'text.secondary' : 'text.primary',
                                mb: 2
                            }}
                        >
                            {task.text}
                        </Typography>
                    )}

                    {/* Футер с кнопками */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Tooltip title={isAdmin ? "Изменить статус" : "Только для админа"}>
                                <span>
                                    <Checkbox
                                        checked={task.isCompleted}
                                        onChange={handleStatusChange}
                                        disabled={!isAdmin}
                                        color="success"
                                        icon={<RadioButtonUnchecked />}
                                        checkedIcon={<CheckCircle />}
                                    />
                                </span>
                            </Tooltip>
                            <Typography variant="body2" color="text.secondary">
                                {task.isCompleted ? 'Выполнена' : 'В работе'}
                            </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={2}>
                            {isAdmin && !isEditing && (
                                <Tooltip title="Редактировать">
                                    <IconButton
                                        onClick={() => setIsEditing(true)}
                                        size="small"
                                        color="primary"
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Box display="flex" alignItems="center" gap={0.5}>
                                <AccessTime fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(task.createdAt)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Уведомление */}
            <Snackbar
                open={notification.open}
                autoHideDuration={3000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TaskItem;