import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTaskRequest } from '../../store/slices/taskRequestsSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { AppDispatch, RootState } from '../../store';
import {
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon, Assignment as TaskIcon } from '@mui/icons-material';

const TaskRequestForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
    const { loading } = useSelector((state: RootState) => state.taskRequests);

    const [formData, setFormData] = useState({
        projectId: '',
        title: '',
        description: '',
        deadline: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.projectId) {
            newErrors.projectId = 'выберите проект';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'введите название задачи';
        } else if (formData.title.length < 3) {
            newErrors.title = 'название слишком короткое';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'введите описание задачи';
        } else if (formData.description.length < 10) {
            newErrors.description = 'описание должно быть подробнее (минимум 10 символов)';
        }

        if (formData.deadline) {
            const selectedDate = new Date(formData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (isNaN(selectedDate.getTime())) {
                newErrors.deadline = 'некорректная дата';
            } else if (selectedDate < today) {
                newErrors.deadline = 'дедлайн не может быть в прошлом';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            const deadlineISO = formData.deadline 
                ? new Date(formData.deadline).toISOString() 
                : undefined;

            await dispatch(createTaskRequest({
                projectId: parseInt(formData.projectId),
                title: formData.title,
                description: formData.description,
                deadline: deadlineISO
            })).unwrap();

            setFormData({
                projectId: '',
                title: '',
                description: '',
                deadline: ''
            });
            setErrors({});
            setSuccess(true);

            setTimeout(() => setSuccess(false), 3000);

        } catch (error: any) {
            setErrors({
                submit: error || 'ошибка создания запроса'
            });
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    if (!user) {
        return (
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Alert severity="info">
                        войдите, чтобы создавать задачи
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskIcon color="primary" />
                    создать задачу
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        запрос на создание задачи отправлен администратору!
                    </Alert>
                )}

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth error={!!errors.projectId}>
                            <InputLabel>проект</InputLabel>
                            <Select
                                name="projectId"
                                value={formData.projectId}
                                label="проект"
                                onChange={handleSelectChange}
                                disabled={loading || projectsLoading}
                                required
                            >
                                {projects.map((project) => (
                                    <MenuItem key={project.id} value={project.id.toString()}>
                                        {project.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.projectId && (
                                <FormHelperText>{errors.projectId}</FormHelperText>
                            )}
                        </FormControl>

                        <TextField
                            label="название задачи"
                            name="title"
                            value={formData.title}
                            onChange={handleTextChange}
                            error={!!errors.title}
                            helperText={errors.title}
                            disabled={loading}
                            fullWidth
                            required
                        />

                        <TextField
                            label="описание задачи"
                            name="description"
                            value={formData.description}
                            onChange={handleTextChange}
                            error={!!errors.description}
                            helperText={errors.description}
                            disabled={loading}
                            multiline
                            rows={4}
                            fullWidth
                            required
                            placeholder="опишите задачу подробно..."
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                            size="large"
                            sx={{ mt: 2 }}
                        >
                            {loading ? 'отправка...' : 'отправить запрос'}
                        </Button>
                    </Box>
                </form>
            </CardContent>
        </Card>
    );
};

export default TaskRequestForm;