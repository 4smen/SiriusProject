export interface User {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    createdAt?: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    createdBy: number;
    createdAt: string;
    creatorName?: string;
}

export interface TaskRequest {
    id: number;
    userId: number;
    projectId: number;
    title: string;
    description: string;
    deadline: string | null;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: number;
    // joined fields
    username?: string;
    userEmail?: string;
    projectName?: string;
}

export interface Task {
    id: number;
    userId: number;
    projectId: number;
    title: string;
    description: string;
    deadline: string | null;
    isCompleted: boolean;
    isEdited: boolean;
    createdAt: string;
    completedAt?: string;
    requestId?: number;
    // joined fields
    username?: string;
    userEmail?: string;
    projectName?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    isVerified: boolean;
}

export interface TaskRequestCreateDTO {
    projectId: number;
    title: string;
    description: string;
    deadline?: string;
}

export interface ProjectCreateDTO {
    name: string;
    description?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    password: string;
    email: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    };
}