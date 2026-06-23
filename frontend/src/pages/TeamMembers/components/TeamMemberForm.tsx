import type { FormEvent } from 'react';

import { createTeamMember, updateTeamMember } from '../../../api/team-members';
import { useTeamMembersDispatch, useTeamMembersState } from '../TeamMembersContext';

const TeamMemberForm = () => {
  const { formData, editingId } = useTeamMembersState();
  const dispatch = useTeamMembersDispatch();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      if (editingId) {
        const updated = await updateTeamMember(editingId, formData);
        dispatch({ type: 'UPDATE_MEMBER', payload: updated });
      } else {
        const created = await createTeamMember(formData);
        dispatch({ type: 'ADD_MEMBER', payload: created });
      }
      dispatch({ type: 'RESET_FORM' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to save team member',
      });
    }
  }

  function handleCancel() {
    dispatch({ type: 'RESET_FORM' });
  }

  return (
    <form
      className="mb-8 rounded-lg bg-white p-6 shadow-md"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label htmlFor="name" className="mb-2 block font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(event) =>
              dispatch({
                type: 'SET_FORM_DATA',
                payload: { ...formData, name: event.target.value },
              })
            }
            required
            className="focus:ring-dps-blue-600 w-full rounded border border-gray-300 p-3 focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="gitHandle" className="mb-2 block font-medium">
            Git Handle
          </label>
          <input
            id="gitHandle"
            type="text"
            value={formData.gitHandle}
            onChange={(event) =>
              dispatch({
                type: 'SET_FORM_DATA',
                payload: { ...formData, gitHandle: event.target.value },
              })
            }
            placeholder="@username"
            required
            className="focus:ring-dps-blue-600 w-full rounded border border-gray-300 p-3 focus:ring-2 focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-4 flex-1">
        <label htmlFor="description" className="mb-2 block font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(event) =>
            dispatch({
              type: 'SET_FORM_DATA',
              payload: { ...formData, description: event.target.value },
            })
          }
          placeholder="Role, skills, or other details..."
          className="min-h-20 w-full resize-y rounded border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-dps-blue-500 hover:bg-dps-blue-600 cursor-pointer rounded px-6 py-3 text-white transition-colors"
        >
          {editingId ? 'Update' : 'Add'} Member
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancel}
            className="cursor-pointer rounded bg-gray-500 px-6 py-3 text-white transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TeamMemberForm;
