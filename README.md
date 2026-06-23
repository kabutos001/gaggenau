# React + FastAPI + PostgreSQL Template

A full-stack template for Digital Product School teams.

## Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy, Alembic, Supabase, Anthropic Claude
- **Database**: PostgreSQL 18
- **Tooling**: ESLint 9, Prettier, uv (Python), Docker

## Project Structure

```
├── frontend/              # React SPA (Vite + TypeScript)
├── backend/               # FastAPI API (Python + SQLAlchemy)
│   ├── app/              # Application source code
│   │   ├── routers/      # API route handlers
│   │   ├── config.py     # Settings management
│   │   ├── db.py         # Database connection
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── errors.py     # Error handlers
│   │   └── main.py       # FastAPI app entry point
│   ├── alembic/          # Database migrations
│   ├── pyproject.toml    # Python dependencies
│   └── uv.lock          # Lock file for dependencies
├── docs/                  # Architecture docs
└── docker-compose.yml     # Local development
```

## Quick Start

### Prerequisites

- **Frontend**: Node.js 20+ and npm 9+
- **Backend**: Python 3.11+ and [uv](https://docs.astral.sh/uv/) (Python package manager)
- **Database**: Docker and Docker Compose

### Install uv (Python package manager)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

### Local Development

#### Option 1: Run with Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, backend, frontend)
docker compose up
```

This starts everything with hot reload:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/docs

#### Option 2: Run Locally with Docker Database

```bash
# 1. Start PostgreSQL only
docker compose up postgres -d

# 2. Set up backend
cd backend
cp .env.example .env  # Create if needed
uv sync                # Install Python dependencies

# Run database migrations (when you have them)
uv run alembic upgrade head

# Start backend server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 3000

# 3. In another terminal, set up frontend
cd frontend
npm install
npm run dev
```

#### Option 3: Full Local Development (No Docker)

Install and run PostgreSQL locally, then update backend `.env` with your local database URL:
```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/dbname
```

Then follow Option 2 steps for backend and frontend.

## Common Commands

### Backend (Python + uv)

```bash
cd backend

# Install dependencies
uv sync

# Install dev dependencies
uv sync --extra dev

# Run development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 3000

# Run tests
uv run pytest

# Linting/formatting
uv run ruff check .          # Lint
uv run ruff check --fix .    # Fix lint issues
uv run ruff format .         # Format code

# Type checking
uv run mypy src/

# Database migrations (once set up)
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Linting/formatting
npm run lint
npm run format
```

### Docker

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild containers
docker compose build

# View logs
docker compose logs -f
```

## Environment Variables

### Backend (`backend/.env`)

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/template_db
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Optional: Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Optional: Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_key
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:3000
```

## Deployment

### Deploy to Coolify

#### 1. Create PostgreSQL Database

In Coolify, create a PostgreSQL database resource and note the connection details.

#### 2. Deploy Backend

1. Create a new resource from this repository
2. Set build context: repository root
3. Set Dockerfile path: `backend/Dockerfile`
4. Set port exposes: `3000`
5. Configure environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (use `postgresql+asyncpg://...`)
   - `PORT`: `3000`
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://fe.my-team.dpschool.app`)
   - Add optional variables for Supabase, Anthropic, etc.

#### 3. Deploy Frontend

1. Create another resource from this repository
2. Set build context: repository root
3. Set Dockerfile path: `frontend/Dockerfile`
4. Set port exposes: `80`
5. Configure environment variable:
   - `VITE_API_URL`: Your backend URL (e.g., `https://be.my-team.dpschool.app`)

## Project Guidelines

- See [CLAUDE.md](CLAUDE.md) for AI agent coding instructions and patterns
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture details