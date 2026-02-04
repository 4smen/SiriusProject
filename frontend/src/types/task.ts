export interface ITask {
    id: number;
    username: string;
    email: string;
    text: string;
    isCompleted: boolean;
    isEdited: boolean;
    createdAt: string;
}

export interface PaginationInfo {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}

export interface TasksResponse {
    data: ITask[];
    pagination: PaginationInfo;
}

export interface TaskFilters {
    page: number;
    limit: number;
    sortField: 'username' | 'email' | 'isCompleted' | 'createdAt';
    sortOrder: 'ASC' | 'DESC';
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