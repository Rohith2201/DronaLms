# Drona LMS

Production-ready, microservice-ready Learning Management System foundation.

## Tech Stack

- Frontend: Angular
- Backend: Spring Boot (Java 17)
- Database: PostgreSQL
- Auth: JWT + Spring Security
- AI Service: FastAPI (Python)
- Storage: S3-compatible object storage

## Workspace Structure

```text
DronaLms/
├── backend/        # Spring Boot service
├── frontend/       # Angular app (planned)
├── ai-service/     # FastAPI service (planned)
├── docs/           # Architecture and schema docs
└── docker-compose.yml
```

## Start Here

- Architecture: `docs/architecture.md`
- Database design: `docs/database-schema.md`
- Backend details: `backend/README.md`
- AI service details: `ai-service/README.md`
- Frontend details: `frontend/README.md`

## Run Full Stack (Docker)

```bash
docker compose up --build
```

Services:
- Backend: `http://localhost:8080`
- AI Service: `http://localhost:8000` (docs at `/docs`)
- PostgreSQL: `localhost:5432`

## Run Frontend (Local)

```bash
cd frontend
npm install
npm start
```

Frontend URL:
- `http://localhost:4200`