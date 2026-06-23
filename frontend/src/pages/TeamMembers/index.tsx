import { useEffect, useReducer } from 'react';

import { getTeamMembers } from '../../api/team-members';
import TeamMemberForm from './components/TeamMemberForm';
import TeamMemberItem from './components/TeamMemberItem';
import {
  initialState,
  TeamMembersDispatchContext,
  teamMembersReducer,
  TeamMembersStateContext,
} from './TeamMembersContext';

const TeamMembers = () => {
  const [state, dispatch] = useReducer(teamMembersReducer, initialState);

  const { loading, error, members } = state;

  useEffect(() => {
    void loadMembers();
  }, []);

  async function loadMembers() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await getTeamMembers();
      dispatch({ type: 'SET_MEMBERS', payload: data });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load team members',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  return (
    <TeamMembersStateContext value={state}>
      <TeamMembersDispatchContext value={dispatch}>
        <div className="mx-auto max-w-3xl p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Team Members</h1>
          {error && <div className="mb-4 rounded bg-red-100 p-4 text-red-800">{error}</div>}

          <TeamMemberForm />
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No team members yet. Add one above!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {members.map((member) => (
                <TeamMemberItem member={member} key={member.id} />
              ))}
            </div>
          )}
        </div>
      </TeamMembersDispatchContext>
    </TeamMembersStateContext>
  );
};

export default TeamMembers;
