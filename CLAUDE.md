# AI Agent Instructions - DPS FastAPI React Template

This file provides context for AI coding agents (Claude Code, GitHub Copilot, OpenAI Codex/ChatGPT, Cursor, etc.).

## Project Overview

Full-stack application with separate frontend and backend:

- `/frontend` - React 19 + Vite 7 + TypeScript + Tailwind CSS 4
- `/backend` - FastAPI (Python 3.11+) + SQLAlchemy + Alembic + PostgreSQL

## Key Patterns

### Backend API Routes

Location: `/backend/src/routers/` or `/backend/src/main.py`

```python
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from .database import get_db
from .models import Item
from .schemas import ItemResponse, ItemCreate, ItemUpdate

router = APIRouter(prefix='/api/items', tags=['items'])

@router.get('/', response_model=List[ItemResponse])
async def get_items(db: AsyncSession = Depends(get_db)):
    """Get all items."""
    result = await db.execute(select(Item).order_by(Item.created_at.desc()))
    items = result.scalars().all()
    return items

@router.post('/', response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    """Create a new item."""
    db_item = Item(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.get('/{item_id}', response_model=ItemResponse)
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific item."""
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail='Item not found')
    return item
```

Key points:
- Use `APIRouter` for route organization
- Type hints for all parameters and return values
- Use Pydantic models for request/response validation
- Use `async/await` with SQLAlchemy async session
- Use `Depends()` for dependency injection
- Raise `HTTPException` for errors
- Include docstrings for endpoints

### Pydantic Schemas

Location: `/backend/src/schemas.py`

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class ItemBase(BaseModel):
    """Base item schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ItemCreate(ItemBase):
    """Schema for creating an item."""
    pass

class ItemUpdate(BaseModel):
    """Schema for updating an item."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ItemResponse(ItemBase):
    """Schema for item response."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

Key points:
- Use Pydantic v2 with `BaseModel`
- Separate schemas for Create, Update, and Response
- Use `Field()` for validation
- Use `ConfigDict(from_attributes=True)` for ORM mapping

### SQLAlchemy Models

Location: `/backend/src/models.py`

```python
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from .database import Base

class Item(Base):
    """Item model."""
    __tablename__ = 'items'
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

Key points:
- Use SQLAlchemy 2.0+ style with `Mapped` and `mapped_column`
- Use `uuid.uuid4()` for IDs (or consider `nanoid` or `cuid2`)
- Always include `created_at` and `updated_at`
- Use appropriate column types (String, Text, Integer, Boolean, etc.)
- Add indexes for fields used in queries

### Frontend API Functions

Location: `/frontend/src/api/`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Item {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemCreate {
  name: string;
  description?: string;
}

export async function getItems(): Promise<Item[]> {
  const response = await fetch(`${API_URL}/api/items`);
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }
  return response.json();
}

export async function createItem(data: ItemCreate): Promise<Item> {
  const response = await fetch(`${API_URL}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create item: ${response.statusText}`);
  }
  return response.json();
}
```

Key points:
- Use native `fetch` API
- Define TypeScript interfaces matching backend Pydantic schemas
- Check `response.ok` and throw errors
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Include `Content-Type` header for JSON requests

## Coding Standards

### Python (Backend)

- **Formatter**: Ruff (configured in `pyproject.toml`)
- **Linter**: Ruff
- **Type checker**: mypy
- **Line width**: 88 characters (Ruff default)
- **Quotes**: Single quotes preferred
- **Imports**: Sorted with isort rules (E, F, I)
- **Docstrings**: Use for all public functions, classes, and modules
- **Async**: Use `async/await` for all database operations

### TypeScript (Frontend)

- **Quotes**: Single quotes
- **Semicolons**: Yes
- **Line width**: 100 characters
- **Indentation**: 2 spaces
- **Trailing commas**: ES5 style
- **Import order**: External deps first, then relative

## Naming Conventions

### Python (Backend)

| Item | Convention | Example |
|------|------------|---------|}
| Files | snake_case | `team_members.py` |
| Classes | PascalCase | `TeamMember` |
| Functions | snake_case | `get_team_member()` |
| Variables | snake_case | `team_member` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Pydantic models | PascalCase | `TeamMemberCreate` |
| Database tables | snake_case | `team_members` |
| Database columns | snake_case | `git_handle` |
| Router tags | lowercase | `'team-members'` |

### TypeScript (Frontend)

| Item | Convention | Example |
|------|------------|---------|}
| React components | PascalCase | `TeamMemberCard.tsx` |
| Utility files | camelCase | `formatDate.ts` |
| API files | kebab-case | `team-members.ts` |
| TypeScript interfaces | PascalCase | `TeamMember` |
| Type request/response | PascalCase | `TeamMemberCreate` |
| Variables | camelCase | `teamMember` |
| CSS classes | kebab-case (Tailwind) | `bg-dps-blue-500` |

## Commands

### Backend (Python)

| Command | Description |
|---------|-------------|
| `cd backend` | Navigate to backend directory |
| `uv sync` | Install dependencies |
| `uv sync --extra dev` | Install with dev dependencies |
| `uv run uvicorn src.main:app --reload` | Start dev server |
| `uv run pytest` | Run tests |
| `uv run ruff check .` | Lint code |
| `uv run ruff check --fix .` | Fix lint issues |
| `uv run ruff format .` | Format code |
| `uv run mypy src/` | Type check |
| `uv run alembic revision --autogenerate -m "msg"` | Create migration |
| `uv run alembic upgrade head` | Run migrations |

### Frontend (TypeScript)

| Command | Description |
|---------|-------------|
| `cd frontend` | Navigate to frontend directory |
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up` | Start all services |
| `docker compose up postgres -d` | Start only database |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and remove volumes |

## Adding Features

### Backend

1. **Model**: Create SQLAlchemy model in `/backend/src/models.py`
2. **Schema**: Create Pydantic schemas in `/backend/src/schemas.py`
3. **Migration**: Run `uv run alembic revision --autogenerate -m "add feature"` and `uv run alembic upgrade head`
4. **Router**: Create router in `/backend/src/routers/` or add to `/backend/src/main.py`
5. **Register**: Include router in main app: `app.include_router(router)`

### Frontend

6. **Types**: Define TypeScript interfaces in API file or separate types file
7. **API client**: Create functions in `/frontend/src/api/`
8. **UI**: Build React components using the API functions

### Full Stack Example

```bash
# Backend
cd backend
# 1. Add model to src/models.py
# 2. Add schemas to src/schemas.py
# 3. Generate migration
uv run alembic revision --autogenerate -m "add team_members"
uv run alembic upgrade head
# 4. Add router to src/routers/team_members.py
# 5. Register in src/main.py

# Frontend
cd frontend
# 6. Add types and API functions to src/api/team-members.ts
# 7. Create components in src/components/team/
```

## Frontend Development Guidelines

- Use Tailwind CSS utility classes
- Font: Plus Jakarta Sans (via `font-sans` class)
- Custom theme values are defined in `index.css` using the `@theme` directive
- Maintain components that you create small, extract new functionality to new components. 
- When you are declaring types needed in the component, extract them to separate types.ts file in the directory next to the component itself 
- When you are declaring constants needed in the component, extract them to separate constants.ts file in the directory next to the component itself.
- If your component uses utility functions independent from component state logic, extract them to separate utils.ts file in the directory next to the component itself. 
- If your component has several state variables, use useReducer hook with actions to extract functionality. 
- If your component is mapping some jsx code to a list of items, extract that code to a separate sub-component.

## Do Not

### Backend

- Use blocking I/O operations (use `async/await`)
- Commit `.env` files (create `.env.example` instead)
- Use `print()` for logging (use FastAPI's logger or `logging` module)
- Ignore type hints (mypy should pass)
- Use synchronous database operations with SQLAlchemy

### Frontend

- Commit `.env` or `.env.local` files (use `.env.example`)
- Use inline styles (use Tailwind classes)
- Use `require()` (use ES imports)
- Use `any` type without justification

### General

- Commit sensitive data (API keys, passwords, tokens)
- Modify auto-generated files (Alembic migrations after creation)

## Project Structure Details

### Backend Structure

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, routers registration
│   ├── config.py         # Settings with pydantic-settings
│   ├── database.py       # Database session, connection
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   └── routers/          # API routers
│       ├── __init__.py
│       └── items.py
├── alembic/              # Database migrations
├── tests/                # Tests
├── pyproject.toml        # Python dependencies
└── uv.lock              # Lock file
```

### Frontend Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── public/               # Static assets
├── package.json
└── vite.config.ts
```

## Documentation Checklist

When making changes, update documentation if:

- [ ] New environment variables → Update README.md, docs/ARCHITECTURE.md and .env.example files
- [ ] New patterns or conventions → Update CLAUDE.md
- [ ] Architectural changes → Update docs/ARCHITECTURE.md
- [ ] New dependencies → Document in README.md why they were added

