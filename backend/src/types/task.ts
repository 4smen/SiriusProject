export interface Task {
    id: number;
    username: string;
    email: string;
    text: string;
    isCompleted: boolean;
    isEdited: boolean;
    createdAt: string;
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