import type {
  ApiErrorResponse,
  ApiResponse,
  CreateTeamMemberRequest,
  TeamMember,
  UpdateTeamMemberRequest,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(API_URL);

class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    super(data.message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.error === 'string' && typeof record.message === 'string';
}

async function parseJson(response: Response): Promise<unknown> {
  return (await response.json()) as unknown;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await parseJson(response).catch(() => null);

  if (!response.ok) {
    const data = isApiErrorResponse(payload)
      ? payload
      : {
          error: 'Unknown error',
          message: 'An unexpected error occurred',
        };
    throw new ApiError(response.status, data);
  }

  return payload as T;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch(`${API_BASE_URL}/team-members`);
  const result = await handleResponse<ApiResponse<TeamMember[]>>(response);
  return result.data;
}

export async function getTeamMember(id: string): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/team-members/${id}`);
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function createTeamMember(data: CreateTeamMemberRequest): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/team-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function updateTeamMember(
  id: string,
  data: UpdateTeamMemberRequest
): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/team-members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ApiResponse<TeamMember>>(response);
  return result.data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/team-members/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ message: string }>(response);
}
