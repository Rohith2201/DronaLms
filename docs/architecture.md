# Drona LMS - Project Architecture

## High-Level Services

- `frontend` (Angular): Student/Instructor/Admin portal
- `backend` (Spring Boot, Java 17): Core LMS REST APIs, RBAC, business logic
- `ai-service` (FastAPI, Python): Quiz generation, summarization, chat assistant
- `postgres` (PostgreSQL): Primary transactional database
- `s3-compatible storage`: Videos, PDFs, generated certificates

## Backend Layered Architecture

```text
com.drona.lms
├── auth
│   ├── controller
│   ├── dto
│   └── service
├── course
│   ├── controller
│   ├── dto
│   └── service
├── ai
│   └── controller
├── config
├── security
├── domain
│   ├── entity
│   ├── enums
│   └── repository
└── common
    ├── exception
    └── model
```

### Request Flow

`Controller -> Service -> Repository -> PostgreSQL`

### Security

- Stateless JWT authentication
- Spring Security with role-based endpoint rules
- Method-level authorization support via `@PreAuthorize`

### Microservice-Ready AI Integration

Backend owns BFF-facing AI endpoints under `/api/v1/ai/*`.
These route (or can be extended to route) to FastAPI service endpoints:

- `/api/v1/ai/quiz/generate`
- `/api/v1/ai/course/summarize`
- `/api/v1/ai/chat`
