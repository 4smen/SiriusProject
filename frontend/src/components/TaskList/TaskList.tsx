import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, setSort } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';
import TaskItem from '../TaskItem/TaskItem';
import Pagination from '../Pagination/Pagination';
import {
    Box,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Typography,
    Container
} from '@mui/material';

const TaskList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks, pagination, filters, loading, error } = useSelector((state: RootState) => state.tasks);

    useEffect(() => {
        dispatch(fetchTasks(filters));
    }, [dispatch, filters]);

    const handleSortChange = (event: SelectChangeEvent) => {
        const [field, order] = event.target.value.split('-');
        dispatch(setSort({
            field: field as any,
            order: order as 'ASC' | 'DESC'
        }));
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h1">
                        Список задач ({pagination.total})
                    </Typography>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Сортировка</InputLabel>
                        <Select
                            value={`${filters.sortField}-${filters.sortOrder}`}
                            label="Сортировка"
                            onChange={handleSortChange}
                        >
                            <MenuItem value="username-ASC">Имя (А-Я)</MenuItem>
                            <MenuItem value="username-DESC">Имя (Я-А)</MenuItem>
                            <MenuItem value="email-ASC">Email (А-Я)</MenuItem>
                            <MenuItem value="email-DESC">Email (Я-А)</MenuItem>
                            <MenuItem value="isCompleted-ASC">Статус (не выполнены)</MenuItem>
                            <MenuItem value="isCompleted-DESC">Статус (выполнены)</MenuItem>
                            <MenuItem value="createdAt-DESC">Новые</MenuItem>
                            <MenuItem value="createdAt-ASC">Старые</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && tasks.length === 0 ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : tasks.length === 0 ? (
                    <Alert severity="info">
                        Нет задач. Создайте первую!
                    </Alert>
                ) : (
                    <>
                        {tasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                        ))}

                        <Pagination />
                    </>
                )}
            </Box>
        </Container>
    );
};

export default TaskList;