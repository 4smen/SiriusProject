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
            field: field,
            order: order as 'ASC' | 'DESC'
        }));
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h1">
                        список задач ({pagination.total})
                    </Typography>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>сортировка</InputLabel>
                        <Select
                            value={`${filters.sortField}-${filters.sortOrder}`}
                            label="сортировка"
                            onChange={handleSortChange}
                        >
                            <MenuItem value="isCompleted-ASC">статус (не выполнены)</MenuItem>
                            <MenuItem value="isCompleted-DESC">статус (выполнены)</MenuItem>
                            <MenuItem value="createdAt-DESC">новые</MenuItem>
                            <MenuItem value="createdAt-ASC">старые</MenuItem>
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
                        нет задач
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