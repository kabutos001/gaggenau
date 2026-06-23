export interface TeamMember {
  id: string;
  name: string;
  description: string | null;
  gitHandle: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberRequest {
  name: string;
  description?: string;
  gitHandle: string;
}

export interface UpdateTeamMemberRequest {
  name?: string;
  description?: string;
  gitHandle?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
