from datetime import datetime
import uuid

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


# Add our SQLAlchemy models here
# Example:
# class User(Base):
#   __tablename__ = 'users'
#
#   id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#   email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
#   created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
#   updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TeamMember(Base):
	__tablename__ = 'team_members'

	id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str | None] = mapped_column(Text(), nullable=True)
	git_handle: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
