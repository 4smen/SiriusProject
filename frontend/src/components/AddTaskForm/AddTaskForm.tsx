import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createTask } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';
import {
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { Add as AddIcon, Email as EmailIcon, Person as PersonIcon } from '@mui/icons-material';

const AddTaskForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        text: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Введите имя';
        } else if (formData.username.length < 2) {
            newErrors.username = 'Имя слишком короткое';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Введите email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }

        if (!formData.text.trim()) {
            newErrors.text = 'Введите текст задачи';
        } else if (formData.text.length < 3) {
            newErrors.text = 'Текст слишком короткий';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        setSuccess(false);

        try {
            await dispatch(createTask(formData)).unwrap();

            setFormData({
                username: '',
                email: '',
                text: ''
            });
            setErrors({});
            setSuccess(true);

            setTimeout(() => setSuccess(false), 3000);

        } catch (error: any) {
            setErrors({
                submit: error || 'Ошибка создания задачи'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    Добавить новую задачу
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Задача успешно создана!
                    </Alert>
                )}

                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Имя пользователя"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            error={!!errors.username}
                            helperText={errors.username}
                            disabled={loading}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />

                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={loading}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />

                        <TextField
                            label="Текст задачи"
                            name="text"
                            value={formData.text}
                            onChange={handleChange}
                            error={!!errors.text}
                            helperText={errors.text}
                            disabled={loading}
                            multiline
                            rows={4}
                            fullWidth
                            required
                            placeholder="Опишите задачу подробно..."
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                            size="large"
                            sx={{ mt: 2 }}
                        >
                            {loading ? 'Создание...' : 'Создать задачу'}
                        </Button>
                    </Box>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddTaskForm;