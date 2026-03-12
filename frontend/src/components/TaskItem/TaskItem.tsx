import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';
import { Task } from '../../types/task';
import {
    Card,
    CardContent,
    Typography,
    Checkbox,
    Box,
    Chip,
    IconButton,
    Collapse,
    Button,
    TextField,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Folder as FolderIcon,
    ExpandMore as ExpandMoreIcon,
    CalendarToday as CalendarIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

interface TaskItemProps {
    task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedText, setEditedText] = useState(task.description);
    const [editedDeadline, setEditedDeadline] = useState(task.deadline ? task.deadline.split('T')[0] : '');

    const isAdmin = user?.isAdmin || false;
    const canEdit = isAdmin && !task.isCompleted;

    const handleComplete = async () => {
        if (!isAdmin) return;
        await dispatch(updateTask({
            id: task.id,
            updates: { isCompleted: !task.isCompleted }
        })).unwrap();
    };

    const handleEdit = () => {
        setEditing(true);
        setEditedText(task.description);
        setEditedDeadline(task.deadline ? task.deadline.split('T')[0] : '');
    };

    const handleSave = async () => {
        const updates: any = {};
        
        if (editedText !== task.description) {
            updates.description = editedText;
        }
        
        if (editedDeadline) {
            const deadlineDate = new Date(editedDeadline);
            deadlineDate.setHours(23, 59, 59, 999);
            updates.deadline = deadlineDate.toISOString();
        } else if (task.deadline) {
            updates.deadline = null;
        }
        
        if (Object.keys(updates).length > 0) {
            await dispatch(updateTask({
                id: task.id,
                updates
            }));
        }
        
        setEditing(false);
    };

    const handleCancel = () => {
        setEditing(false);
        setEditedText(task.description);
        setEditedDeadline(task.deadline ? task.deadline.split('T')[0] : '');
    };

    const isOverdue = task.deadline && !task.isCompleted && new Date(task.deadline) < new Date();

    return (
        <Card sx={{ 
            mb: 2, 
            opacity: task.isCompleted ? 0.7 : 1,
            borderLeft: isOverdue ? '4px solid' : 'none',
            borderLeftColor: 'error.main'
        }}>
            <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                    {isAdmin && (
                        <Checkbox
                            checked={task.isCompleted}
                            onChange={handleComplete}
                            color="success"
                            sx={{ mt: -0.5 }}
                        />
                    )}

                    <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                            <Typography variant="h6">
                                {task.title}
                            </Typography>
                            {task.isEdited && (
                                <Chip
                                    label="изменено"
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                            {isOverdue && (
                                <Chip
                                    icon={<WarningIcon />}
                                    label="просрочено"
                                    size="small"
                                    color="error"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                            )}
                        </Box>

                        <Box display="flex" alignItems="center" gap={2} mb={1} flexWrap="wrap">
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    {task.username || 'неизвестно'}
                                </Typography>
                            </Box>

                            <Box display="flex" alignItems="center" gap={0.5}>
                                <FolderIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="primary">
                                    {task.projectName || 'без проекта'}
                                </Typography>
                            </Box>
                            
                            {task.deadline && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <CalendarIcon fontSize="small" color="action" />
                                    <Tooltip title="дедлайн">
                                        <Typography 
                                            variant="body2" 
                                            color={isOverdue ? 'error' : 'text.secondary'}
                                            fontWeight={isOverdue ? 'bold' : 'normal'}
                                        >
                                            {new Date(task.deadline).toLocaleString('ru-RU', {
                                                day: 'numeric',
                                                month: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                            )}
                        </Box>

                        {editing ? (
                            <Box sx={{ my: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    size="small"
                                    label="описание"
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    type="date"
                                    fullWidth
                                    value={editedDeadline}
                                    onChange={(e) => setEditedDeadline(e.target.value)}
                                    size="small"
                                    label="дедлайн"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: new Date().toISOString().split('T')[0]
                                    }}
                                />
                            </Box>
                        ) : (
                            <Collapse in={expanded} collapsedSize={60}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        ...(!expanded && {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        })
                                    }}
                                >
                                    {task.description}
                                </Typography>
                            </Collapse>
                        )}

                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="caption" color="text.secondary">
                                    создано: {new Date(task.createdAt).toLocaleString()}
                                </Typography>
                                {task.completedAt && (
                                    <Typography variant="caption" color="success.main">
                                        • выполнено: {new Date(task.completedAt).toLocaleString()}
                                    </Typography>
                                )}
                            </Box>

                            <Box>
                                {!editing && (
                                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                                        <ExpandMoreIcon sx={{
                                            transform: expanded ? 'rotate(180deg)' : 'none'
                                        }} />
                                    </IconButton>
                                )}

                                {canEdit && !editing && (
                                    <IconButton size="small" onClick={handleEdit}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                )}

                                {editing && (
                                    <>
                                        <IconButton size="small" onClick={handleSave} color="success">
                                            <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={handleCancel} color="error">
                                            <CancelIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default TaskItem;