# Drona LMS - PostgreSQL Schema

## Core Tables

- `users`
- `roles`
- `user_roles`
- `courses`
- `modules`
- `lessons`
- `enrollments`
- `quizzes`
- `questions`
- `submissions`
- `certificates`

## Design Notes

- UUID primary keys for scale-friendly distributed creation (except `roles` with small identity key)
- Composite unique constraints to preserve order integrity per parent (`module/lesson/question` position)
- Enrollment uniqueness on `(student_id, course_id)`
- JSONB fields for flexible question options and submission answers
- Targeted indexes on all major FK columns and high-frequency lookup columns
- Audit fields (`created_at`, `updated_at`) across all tables

## Migration Source

Schema is implemented in Flyway migration:

- `backend/src/main/resources/db/migration/V1__init_schema.sql`
