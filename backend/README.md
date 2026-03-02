# Drona LMS Backend

Spring Boot 3.4 + Java 17 backend for Drona LMS.

## API Reference

- Complete endpoint list: `ENDPOINTS.md`

## Implemented in this phase

- Production-ready package structure (layered architecture)
- PostgreSQL schema via Flyway (`V1__init_schema.sql`)
- Core JPA entities for LMS domain
- JWT authentication module with role-based security
- Validation and global exception handling
- Paginated course listing endpoint
- Docker-ready build and environment variable setup
- Instructor ownership authorization hardening for instructor-scoped resources

## Auth APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

## Course APIs

- `GET /api/v1/courses?q=&published=&page=&size=`
- `GET /api/v1/courses/{courseId}`
- `POST /api/v1/courses` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/courses/{courseId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/courses/{courseId}` (ADMIN/INSTRUCTOR)

## Module APIs

- `GET /api/v1/modules/course/{courseId}`
- `GET /api/v1/modules/{moduleId}`
- `POST /api/v1/modules/course/{courseId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/modules/{moduleId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/modules/{moduleId}` (ADMIN/INSTRUCTOR)

## Lesson APIs

- `GET /api/v1/lessons/module/{moduleId}`
- `GET /api/v1/lessons/{lessonId}`
- `POST /api/v1/lessons/module/{moduleId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/lessons/{lessonId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/lessons/{lessonId}` (ADMIN/INSTRUCTOR)

## Enrollment & Progress APIs

- `GET /api/v1/enrollments/me`
- `POST /api/v1/enrollments` (STUDENT)
- `PATCH /api/v1/enrollments/{enrollmentId}/progress` (STUDENT/ADMIN/INSTRUCTOR)

## Submission APIs

- `POST /api/v1/submissions` (STUDENT)
- `GET /api/v1/submissions/me` (STUDENT)
- `GET /api/v1/submissions/quiz/{quizId}` (ADMIN/INSTRUCTOR)
- `PATCH /api/v1/submissions/{submissionId}/grade` (ADMIN/INSTRUCTOR)

## Quiz APIs

- `GET /api/v1/quizzes/module/{moduleId}`
- `GET /api/v1/quizzes/{quizId}`
- `POST /api/v1/quizzes/module/{moduleId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)

## Question APIs

- `GET /api/v1/questions/quiz/{quizId}`
- `GET /api/v1/questions/{questionId}`
- `POST /api/v1/questions/quiz/{quizId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)

## Certificate APIs

- `POST /api/v1/certificates/issue` (ADMIN/INSTRUCTOR)
- `GET /api/v1/certificates/{certificateId}`
- `GET /api/v1/certificates/enrollment/{enrollmentId}`
- `GET /api/v1/certificates/me` (STUDENT)
- `PATCH /api/v1/submissions/{submissionId}/grade` (ADMIN/INSTRUCTOR)

## Quiz APIs

- `GET /api/v1/quizzes/module/{moduleId}`
- `GET /api/v1/quizzes/{quizId}`
- `POST /api/v1/quizzes/module/{moduleId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)

## Question APIs

- `GET /api/v1/questions/quiz/{quizId}`
- `GET /api/v1/questions/{questionId}`
- `POST /api/v1/questions/quiz/{quizId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)

## Certificate APIs

- `POST /api/v1/certificates/issue` (ADMIN/INSTRUCTOR)
- `GET /api/v1/certificates/{certificateId}`
- `GET /api/v1/certificates/enrollment/{enrollmentId}`
- `GET /api/v1/certificates/me` (STUDENT)

## OpenAPI

- `GET /v3/api-docs`
- `GET /swagger-ui/index.html`

## AI Integration Readiness

- `GET /api/v1/ai/health` exposes configured AI endpoints map.

## Run locally

```bash
cd backend
mvn spring-boot:run
```

## Build

```bash
cd backend
mvn clean package
```
