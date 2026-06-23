import type { FC } from 'react';

import { deleteTeamMember } from '../../../api/team-members';
import type { TeamMember } from '../../../types/api';
import { useTeamMembersDispatch } from '../TeamMembersContext';

interface TeamMemberItemProperties {
  member: TeamMember;
}

const TeamMemberItem: FC<TeamMemberItemProperties> = ({ member }) => {
  const dispatch = useTeamMembersDispatch();

  function handleEdit() {
    dispatch({ type: 'SET_EDITING_ID', payload: member.id });
    dispatch({
      type: 'SET_FORM_DATA',
      payload: {
        name: member.name,
        description: member.description || '',
        gitHandle: member.gitHandle,
      },
    });
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      await deleteTeamMember(member.id);
      dispatch({ type: 'DELETE_MEMBER', payload: member.id });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to delete team member',
      });
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h2 className="text-xl font-semibold">{member.name}</h2>
        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-500">
          @{member.gitHandle}
        </span>
      </div>
      {member.description && <p className="my-2 mb-4 text-gray-600">{member.description}</p>}
      <div className="flex gap-2">
        <button
          className="cursor-pointer rounded bg-gray-500 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
          onClick={handleEdit}
        >
          Edit
        </button>
        <button
          className="cursor-pointer rounded bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
          onClick={() => {
            void handleDelete();
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TeamMemberItem;
