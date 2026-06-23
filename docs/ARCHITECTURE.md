# Architecture Documentation

## System Overview

This is a full-stack web application template using a monorepo structure with npm workspaces.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│   (React/Vite)  │     │   (Express)     │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
    ┌─────────────────────────────────────┐
    │           Shared Types              │
    │         (@template/shared)          │
    └─────────────────────────────────────┘
```

### Data Flow

1. User interacts with React frontend
2. Frontend calls backend API via fetch functions in `/api`
3. Express backend validates request, queries Prisma ORM
4. Prisma communicates with PostgreSQL
5. Response flows back: Database → Prisma → Express → Frontend → User

## Monorepo Structure

```
dps-react-express-template/
├── frontend/              # React SPA (Vite)
├── backend/               # FastAPI API (SQLAlchemy + Alembic)
├── docs/                  # Architecture docs
├── docker-compose.yml     # Local development
└── package.json           # Root scripts
├── eslint.config.js       # ESLint 9 flat config
├── .prettierrc            # Prettier formatting rules
└── .husky/                # Git hooks (pre-commit linting)
```

## Package Details

### packages/frontend

**Tech Stack**: React 19, Vite 7, Tailwind CSS 4, TypeScript

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── fonts/            # Self-hosted fonts (Plus Jakarta Sans)
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind theme
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
└── package.json
```

**Key Decisions**:
- Vite for fast HMR and optimized builds
- Tailwind 4 with `@theme` directive for design tokens
- Self-hosted fonts for GDPR compliance
- Native fetch for API calls (no axios dependency)

### packages/backend

**Tech Stack**: Express 5, Prisma 7, PostgreSQL, TypeScript

```
backend/
├── src/
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Express middleware (error handling)
│   └── index.ts          # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── generated/        # Prisma client (auto-generated)
│   └── migrations/       # Database migrations
├── tsconfig.json
└── package.json
```

**Key Decisions**:
- Prisma 7 with PostgreSQL adapter for type-safe database access
- Express 5 for async middleware support
- CORS configured for frontend origin
- Graceful shutdown handlers for clean exit

### packages/shared

**Purpose**: Single source of truth for TypeScript types used by both frontend and backend.

```
shared/
├── src/
│   ├── types/
│   │   └── index.ts      # All type definitions
│   └── index.ts          # Re-exports
├── tsconfig.json
└── package.json
```

**Type Categories**:
- Entity types (e.g., `TeamMember`)
- Request types (e.g., `CreateTeamMemberRequest`, `UpdateTeamMemberRequest`)
- Response wrappers (`ApiResponse<T>`, `ApiErrorResponse`, `PaginatedResponse<T>`)

## Patterns

### API Response Format

**Success responses**:
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

**Error responses**:
```json
{
  "error": "Error type",
  "message": "Human-readable error description"
}
```

### Error Handling

**Backend**: Centralized error handler middleware catches all errors passed via `next(error)`.

```typescript
// Route handler pattern
router.get('/', async (req, res, next) => {
  try {
    // ... logic
  } catch (error) {
    next(error);  // Pass to error middleware
  }
});
```

**Frontend**: `ApiError` class wraps HTTP errors with status and response data.

```typescript
class ApiError extends Error {
  constructor(public status: number, public data: ApiErrorResponse) {
    super(data.message);
  }
}
```

### Database Conventions

- Primary keys: `cuid()` format
- Timestamps: `createdAt` (auto-set), `updatedAt` (auto-updated)
- Unique constraints: Use `@unique` decorator
- Optional fields: Use `?` suffix (e.g., `description String?`)

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Docker Development

The `docker-compose.yml` orchestrates three services:

1. **postgres**: PostgreSQL 16 database with health checks
2. **backend**: Express server, depends on postgres, exposes port 3000
3. **frontend**: Vite dev server, depends on backend, exposes port 5173

Volumes enable hot reload by mounting source directories.
