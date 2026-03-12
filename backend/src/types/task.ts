export interface Task {
    id: number;
    userId: number;
    projectId: number;
    title: string;
    description: string;
    deadline?: string;
    isCompleted: boolean;
    isEdited: boolean;
    createdAt: string;
    completedAt?: string;
    requestId?: number;
    username?: string;
    userEmail?: string;
    projectName?: string;
}

export interface TaskRequest {
    id: number;
    userId: number;
    projectId: number;
    title: string;
    description: string;
    deadline?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: number;
    // joined fields
    username?: string;
    userEmail?: string;
    projectName?: string;
}

export interface TaskCreateDTO {
    username: string;
    email: string;
    text: string;
}

export interface TaskUpdateDTO {
    text?: string;
    isCompleted?: boolean;
}

export interface TaskRequestCreateDTO {
    projectId: number;
    title: string;
    description: string;
    deadline?: string;
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

export interface SortOptions {
    field: 'username' | 'email' | 'isCompleted' | 'createdAt';
    order: 'ASC' | 'DESC';
}