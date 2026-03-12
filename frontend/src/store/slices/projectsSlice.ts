import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectsAPI } from '../../services/api';
import { Project, ProjectCreateDTO } from '../../types/task';

interface ProjectsState {
    projects: Project[];
    loading: boolean;
    error: string | null;
}

const initialState: ProjectsState = {
    projects: [],
    loading: false,
    error: null
};

export const fetchProjects = createAsyncThunk(
    'projects/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await projectsAPI.getAll();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка загрузки проектов');
        }
    }
);

export const createProject = createAsyncThunk(
    'projects/create',
    async (data: ProjectCreateDTO, { rejectWithValue }) => {
        try {
            const response = await projectsAPI.create(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'ошибка создания проекта');
        }
    }
);

const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.projects.unshift(action.payload);
            });
    }
});

export default projectsSlice.reducer;