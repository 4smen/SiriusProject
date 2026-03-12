// frontend/src/components/ProjectForm/ProjectForm.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject } from '../../store/slices/projectsSlice';
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
    Collapse
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const ProjectForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { loading } = useSelector((state: RootState) => state.projects);

    const [expanded, setExpanded] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    if (!user?.isAdmin) {
        return null;
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'введите название проекта';
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
            await dispatch(createProject(formData)).unwrap();

            setFormData({
                name: '',
                description: ''
            });
            setErrors({});
            setSuccess(true);
            setExpanded(false);

            setTimeout(() => setSuccess(false), 3000);

        } catch (error: any) {
            setErrors({
                submit: error || 'ошибка создания проекта'
            });
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
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">управление проектами</Typography>
                    <Button
                        onClick={() => setExpanded(!expanded)}
                        endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />}
                    >
                        {expanded ? 'скрыть' : 'создать проект'}
                    </Button>
                </Box>

                <Collapse in={expanded}>
                    {success && (
                        <Alert severity="success" sx={{ my: 2 }}>
                            проект создан!
                        </Alert>
                    )}

                    {errors.submit && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {errors.submit}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="название проекта"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                disabled={loading}
                                fullWidth
                                required
                                autoFocus
                            />

                            <TextField
                                label="описание (необязательно)"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                disabled={loading}
                                multiline
                                rows={2}
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                            >
                                {loading ? 'создание...' : 'создать проект'}
                            </Button>
                        </Box>
                    </form>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default ProjectForm;