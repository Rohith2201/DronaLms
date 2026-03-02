# Backend API Endpoints

Base URL: `http://localhost:8080`
API prefix: `/api/v1`

## Authentication
- `POST /api/v1/auth/register` (Public)
- `POST /api/v1/auth/login` (Public)

## Users (Admin)
- `GET /api/v1/users`
- `GET /api/v1/users/analytics`
- `PATCH /api/v1/users/{userId}/role?role={ROLE}`

## Courses
- `GET /api/v1/courses`
  - Query params: `q`, `published`, `instructorEmail`, `category`, `level`, `status`, `page`, `size`, `sort`
- `GET /api/v1/courses/{courseId}`
- `POST /api/v1/courses` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/courses/{courseId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/courses/{courseId}` (ADMIN/INSTRUCTOR)
- `GET /api/v1/courses/{courseId}/analytics` (ADMIN/INSTRUCTOR)
- `GET /api/v1/courses/{courseId}/enrolled-users` (ADMIN/INSTRUCTOR)

## Modules
- `GET /api/v1/modules/course/{courseId}`
- `GET /api/v1/modules/{moduleId}`
- `POST /api/v1/modules/course/{courseId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/modules/{moduleId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/modules/{moduleId}` (ADMIN/INSTRUCTOR)

## Lessons
- `GET /api/v1/lessons/module/{moduleId}`
- `GET /api/v1/lessons/{lessonId}`
- `POST /api/v1/lessons/module/{moduleId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/lessons/{lessonId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/lessons/{lessonId}` (ADMIN/INSTRUCTOR)

## Quizzes
- `GET /api/v1/quizzes/module/{moduleId}`
- `GET /api/v1/quizzes/{quizId}`
- `POST /api/v1/quizzes/module/{moduleId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/quizzes/{quizId}` (ADMIN/INSTRUCTOR)

## Questions
- `GET /api/v1/questions/quiz/{quizId}`
- `GET /api/v1/questions/{questionId}`
- `POST /api/v1/questions/quiz/{quizId}` (ADMIN/INSTRUCTOR)
- `PUT /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)
- `DELETE /api/v1/questions/{questionId}` (ADMIN/INSTRUCTOR)

## Enrollments
- `GET /api/v1/enrollments/me` (STUDENT/ADMIN/INSTRUCTOR)
- `POST /api/v1/enrollments` (STUDENT)
- `PATCH /api/v1/enrollments/{enrollmentId}/progress` (STUDENT/ADMIN/INSTRUCTOR)

## Submissions
- `POST /api/v1/submissions` (STUDENT)
- `GET /api/v1/submissions/me` (STUDENT)
- `GET /api/v1/submissions/quiz/{quizId}` (ADMIN/INSTRUCTOR)
- `PATCH /api/v1/submissions/{submissionId}/grade` (ADMIN/INSTRUCTOR)

## Certificates
- `POST /api/v1/certificates/issue` (ADMIN/INSTRUCTOR/STUDENT)
- `GET /api/v1/certificates/{certificateId}`
- `GET /api/v1/certificates/enrollment/{enrollmentId}`
- `GET /api/v1/certificates/me` (ADMIN/STUDENT)
- `GET /api/v1/certificates/public/verify/{certificateNumber}` (Public)
- `GET /api/v1/certificates/{certificateId}/pdf` (PDF Download)

## AI
- `GET /api/v1/ai/health`

## OpenAPI
- `GET /v3/api-docs`
- `GET /swagger-ui/index.html`

## Test Payload Catalog
Use the companion JSON file:
- `docs/backend-test-requests.json`
