import { createContext, type Dispatch, use } from 'react';

import type { CreateTeamMemberRequest, TeamMember } from '../../types/api';

export interface TeamMembersState {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
  editingId: string | null;
  formData: CreateTeamMemberRequest;
}

export type TeamMembersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEMBERS'; payload: TeamMember[] }
  | { type: 'ADD_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_MEMBER'; payload: TeamMember }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'SET_EDITING_ID'; payload: string | null }
  | { type: 'SET_FORM_DATA'; payload: CreateTeamMemberRequest }
  | { type: 'RESET_FORM' };

const initialFormData: CreateTeamMemberRequest = {
  name: '',
  description: '',
  gitHandle: '',
};

export const initialState: TeamMembersState = {
  members: [],
  loading: true,
  error: null,
  editingId: null,
  formData: initialFormData,
};

export function teamMembersReducer(
  state: TeamMembersState,
  action: TeamMembersAction
): TeamMembersState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
    case 'ADD_MEMBER':
      return { ...state, members: [action.payload, ...state.members] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((member) =>
          member.id === action.payload.id ? action.payload : member
        ),
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.payload),
      };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    case 'RESET_FORM':
      return { ...state, formData: initialFormData, editingId: null };
    default:
      return state;
  }
}

export const TeamMembersStateContext = createContext<TeamMembersState | null>(null);
export const TeamMembersDispatchContext = createContext<Dispatch<TeamMembersAction> | null>(null);

export function useTeamMembersState(): TeamMembersState {
  const context = use(TeamMembersStateContext);
  if (context === null) {
    throw new Error('useTeamMembersState must be used within a TeamMembersProvider');
  }
  return context;
}

export function useTeamMembersDispatch(): Dispatch<TeamMembersAction> {
  const context = use(TeamMembersDispatchContext);
  if (context === null) {
    throw new Error('useTeamMembersDispatch must be used within a TeamMembersProvider');
  }
  return context;
}
