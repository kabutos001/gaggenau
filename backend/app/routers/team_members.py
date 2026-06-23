from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from psycopg.errors import UniqueViolation
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import TeamMember
from ..schemas import (
  CreateTeamMemberRequest,
  TeamMemberResponse,
  UpdateTeamMemberRequest,
  to_iso_utc,
)


router = APIRouter(prefix='/api/team-members', tags=['team-members'])


def to_response(member: TeamMember) -> TeamMemberResponse:
  return TeamMemberResponse(
    id=member.id,
    name=member.name,
    description=member.description,
    gitHandle=member.git_handle,
    createdAt=to_iso_utc(member.created_at),
    updatedAt=to_iso_utc(member.updated_at),
  )


@router.get('')
def get_team_members(db: Session = Depends(get_db)) -> dict[str, list[dict[str, str | None]]]:
  members = db.query(TeamMember).order_by(desc(TeamMember.created_at)).all()
  return {'data': [to_response(member).model_dump() for member in members]}


@router.get('/{member_id}')
def get_team_member(member_id: str, db: Session = Depends(get_db)) -> dict[str, dict[str, str | None]]:
  member = db.query(TeamMember).filter(TeamMember.id == member_id).first()

  if not member:
    raise HTTPException(status_code=404, detail={'error': 'Not found', 'message': 'Team member not found'})

  return {'data': to_response(member).model_dump()}


@router.post('', status_code=201)
def create_team_member(
  payload: CreateTeamMemberRequest,
  db: Session = Depends(get_db),
) -> dict[str, dict[str, str | None] | str]:
  if not payload.name or not payload.gitHandle:
    raise HTTPException(
      status_code=400,
      detail={'error': 'Validation error', 'message': 'Name and gitHandle are required'},
    )

  member = TeamMember(
    name=payload.name,
    description=payload.description,
    git_handle=payload.gitHandle,
  )

  try:
    db.add(member)
    db.commit()
    db.refresh(member)
  except IntegrityError as error:
    db.rollback()
    if isinstance(error.orig, UniqueViolation):
      raise HTTPException(
        status_code=409,
        detail={
          'error': 'Conflict',
          'message': 'A team member with this git handle already exists',
        },
      ) from error
    raise

  return {
    'data': to_response(member).model_dump(),
    'message': 'Team member created successfully',
  }


@router.put('/{member_id}')
def update_team_member(
  member_id: str,
  payload: UpdateTeamMemberRequest,
  db: Session = Depends(get_db),
) -> dict[str, dict[str, str | None] | str]:
  member = db.query(TeamMember).filter(TeamMember.id == member_id).first()

  if not member:
    raise HTTPException(status_code=404, detail={'error': 'Not found', 'message': 'Team member not found'})

  if payload.name is not None:
    member.name = payload.name
  if payload.description is not None:
    member.description = payload.description
  if payload.gitHandle is not None:
    member.git_handle = payload.gitHandle

  member.updated_at = datetime.now(tz=timezone.utc)

  try:
    db.commit()
    db.refresh(member)
  except IntegrityError as error:
    db.rollback()
    if isinstance(error.orig, UniqueViolation):
      raise HTTPException(
        status_code=409,
        detail={
          'error': 'Conflict',
          'message': 'A team member with this git handle already exists',
        },
      ) from error
    raise

  return {'data': to_response(member).model_dump(), 'message': 'Team member updated successfully'}


@router.delete('/{member_id}')
def delete_team_member(member_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
  member = db.query(TeamMember).filter(TeamMember.id == member_id).first()

  if not member:
    raise HTTPException(status_code=404, detail={'error': 'Not found', 'message': 'Team member not found'})

  db.delete(member)
  db.commit()

  return {'message': 'Team member deleted successfully'}
