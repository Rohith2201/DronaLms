# Backend API Detailed Reference

Base URL: `http://localhost:8080`
API Prefix: `/api/v1`

## Authentication

### `POST /api/v1/auth/register`
- Auth: Public
- Request Body:
```json
{
  "email": "student1@example.com",
  "password": "Password@123",
  "firstName": "Student",
  "lastName": "One",
  "role": "STUDENT"
}
```

### `POST /api/v1/auth/login`
- Auth: Public
- Request Body:
```json
{
  "email": "student1@example.com",
  "password": "Password@123"
}
```

---

## Users (Admin)

### `GET /api/v1/users`
- Auth: `ADMIN`
- Query Params (optional):
  - `search` (string)
  - `role` (string)
  - `page` (number)
  - `size` (number)
  - `sort` (string)
- Request Body: None

### `GET /api/v1/users/analytics`
- Auth: `ADMIN`
- Request Body: None

### `PATCH /api/v1/users/{userId}/role?role={ROLE}`
- Auth: `ADMIN`
- Path Params:
  - `userId` (UUID)
- Query Params:
  - `role` (e.g. `ADMIN`, `INSTRUCTOR`, `STUDENT`)
- Request Body: None

---

## Courses

### `GET /api/v1/courses`
- Auth: Authenticated user
- Query Params (optional):
  - `q` (string)
  - `published` (boolean)
  - `instructorEmail` (string, supports `me`)
  - `category` (string)
  - `level` (string)
  - `status` (`PUBLISHED`/`DRAFT`)
  - `page` (number)
  - `size` (number)
  - `sort` (string)
- Request Body: None

### `GET /api/v1/courses/{courseId}`
- Auth: Authenticated user
- Path Params:
  - `courseId` (UUID)
- Request Body: None

### `POST /api/v1/courses`
- Auth: `ADMIN` or `INSTRUCTOR`
- Request Body:
```json
{
  "title": "Java Backend Mastery",
  "description": "Complete Spring Boot course",
  "category": "Programming",
  "level": "BEGINNER",
  "thumbnailUrl": "https://images.example.com/course-java.jpg",
  "published": true
}
```

### `PUT /api/v1/courses/{courseId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `courseId` (UUID)
- Request Body:
```json
{
  "title": "Java Backend Mastery - Updated",
  "description": "Updated description",
  "category": "Programming",
  "level": "INTERMEDIATE",
  "thumbnailUrl": "https://images.example.com/course-java-updated.jpg",
  "published": true
}
```

### `DELETE /api/v1/courses/{courseId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `courseId` (UUID)
- Request Body: None

### `GET /api/v1/courses/{courseId}/analytics`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `courseId` (UUID)
- Request Body: None

### `GET /api/v1/courses/{courseId}/enrolled-users`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `courseId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

---

## Modules

### `GET /api/v1/modules/course/{courseId}`
- Auth: Authenticated user
- Path Params:
  - `courseId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/modules/{moduleId}`
- Auth: Authenticated user
- Path Params:
  - `moduleId` (UUID)
- Request Body: None

### `POST /api/v1/modules/course/{courseId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `courseId` (UUID)
- Request Body:
```json
{
  "title": "Spring Boot Basics",
  "description": "Core fundamentals",
  "position": 1
}
```

### `PUT /api/v1/modules/{moduleId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `moduleId` (UUID)
- Request Body:
```json
{
  "title": "Spring Boot Basics Updated",
  "description": "Updated module description",
  "position": 1
}
```

### `DELETE /api/v1/modules/{moduleId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `moduleId` (UUID)
- Request Body: None

---

## Lessons

### `GET /api/v1/lessons/module/{moduleId}`
- Auth: Authenticated user
- Path Params:
  - `moduleId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/lessons/{lessonId}`
- Auth: Authenticated user
- Path Params:
  - `lessonId` (UUID)
- Request Body: None

### `POST /api/v1/lessons/module/{moduleId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `moduleId` (UUID)
- Request Body (VIDEO example):
```json
{
  "title": "Introduction to REST APIs",
  "contentType": "VIDEO",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "pdfUrl": null,
  "contentText": null,
  "durationSeconds": 600,
  "position": 1
}
```

### `PUT /api/v1/lessons/{lessonId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `lessonId` (UUID)
- Request Body (TEXT example):
```json
{
  "title": "HTTP Methods",
  "contentType": "TEXT",
  "videoUrl": null,
  "pdfUrl": null,
  "contentText": "GET, POST, PUT, DELETE explained",
  "durationSeconds": 180,
  "position": 3
}
```

### `DELETE /api/v1/lessons/{lessonId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `lessonId` (UUID)
- Request Body: None

---

## Quizzes

### `GET /api/v1/quizzes/module/{moduleId}`
- Auth: Authenticated user
- Path Params:
  - `moduleId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/quizzes/{quizId}`
- Auth: Authenticated user
- Path Params:
  - `quizId` (UUID)
- Request Body: None

### `POST /api/v1/quizzes/module/{moduleId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `moduleId` (UUID)
- Request Body:
```json
{
  "title": "Module 1 Quiz",
  "description": "Covers basics",
  "maxScore": 100,
  "timeLimitMinutes": 30,
  "passingScore": 60,
  "generatedByAi": false
}
```

### `PUT /api/v1/quizzes/{quizId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `quizId` (UUID)
- Request Body:
```json
{
  "title": "Module 1 Quiz - Updated",
  "description": "Updated description",
  "maxScore": 100,
  "timeLimitMinutes": 25,
  "passingScore": 60,
  "generatedByAi": false
}
```

### `DELETE /api/v1/quizzes/{quizId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `quizId` (UUID)
- Request Body: None

---

## Questions

### `GET /api/v1/questions/quiz/{quizId}`
- Auth: Authenticated user
- Path Params:
  - `quizId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/questions/{questionId}`
- Auth: Authenticated user
- Path Params:
  - `questionId` (UUID)
- Request Body: None

### `POST /api/v1/questions/quiz/{quizId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `quizId` (UUID)
- Request Body:
```json
{
  "questionText": "Which HTTP method is idempotent?",
  "questionType": "MULTIPLE_CHOICE",
  "optionsJson": "[\"POST\",\"GET\",\"PATCH\",\"CONNECT\"]",
  "correctAnswer": "GET",
  "points": 10,
  "position": 1
}
```

### `PUT /api/v1/questions/{questionId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `questionId` (UUID)
- Request Body:
```json
{
  "questionText": "Which HTTP method is safe and idempotent?",
  "questionType": "MULTIPLE_CHOICE",
  "optionsJson": "[\"POST\",\"GET\",\"PATCH\",\"DELETE\"]",
  "correctAnswer": "GET",
  "points": 10,
  "position": 1
}
```

### `DELETE /api/v1/questions/{questionId}`
- Auth: `ADMIN` or `INSTRUCTOR`
- Path Params:
  - `questionId` (UUID)
- Request Body: None

---

## Enrollments

### `GET /api/v1/enrollments/me`
- Auth: `STUDENT` / `ADMIN` / `INSTRUCTOR`
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `POST /api/v1/enrollments`
- Auth: `STUDENT`
- Request Body:
```json
{
  "courseId": "00000000-0000-0000-0000-000000000001"
}
```

### `PATCH /api/v1/enrollments/{enrollmentId}/progress`
- Auth: `STUDENT` / `ADMIN` / `INSTRUCTOR`
- Path Params:
  - `enrollmentId` (UUID)
- Request Body:
```json
{
  "progressPercent": 75.5
}
```

---

## Submissions

### `POST /api/v1/submissions`
- Auth: `STUDENT`
- Request Body:
```json
{
  "submissionType": "QUIZ",
  "quizId": "00000000-0000-0000-0000-000000000002",
  "title": "Module 1 Quiz Attempt",
  "answerJson": "{\"q1\":\"GET\",\"q2\":\"201\"}"
}
```

### `GET /api/v1/submissions/me`
- Auth: `STUDENT`
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/submissions/quiz/{quizId}`
- Auth: `ADMIN` / `INSTRUCTOR`
- Path Params:
  - `quizId` (UUID)
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `PATCH /api/v1/submissions/{submissionId}/grade`
- Auth: `ADMIN` / `INSTRUCTOR`
- Path Params:
  - `submissionId` (UUID)
- Request Body:
```json
{
  "score": 88.5,
  "feedback": "Good understanding, revise status codes"
}
```

---

## Certificates

### `POST /api/v1/certificates/issue`
- Auth: `ADMIN` / `INSTRUCTOR` / `STUDENT`
- Request Body:
```json
{
  "enrollmentId": "00000000-0000-0000-0000-000000000003",
  "fileUrl": "https://example.com/certificates/cert-001.pdf"
}
```

### `GET /api/v1/certificates/{certificateId}`
- Auth: Authenticated user
- Path Params:
  - `certificateId` (UUID)
- Request Body: None

### `GET /api/v1/certificates/enrollment/{enrollmentId}`
- Auth: Authenticated user
- Path Params:
  - `enrollmentId` (UUID)
- Request Body: None

### `GET /api/v1/certificates/me`
- Auth: `ADMIN` / `STUDENT`
- Query Params (optional): `page`, `size`, `sort`
- Request Body: None

### `GET /api/v1/certificates/public/verify/{certificateNumber}`
- Auth: Public
- Path Params:
  - `certificateNumber` (string)
- Request Body: None

### `GET /api/v1/certificates/{certificateId}/pdf`
- Auth: Public (direct PDF download in current config)
- Path Params:
  - `certificateId` (UUID)
- Request Body: None

---

## AI

### `GET /api/v1/ai/health`
- Auth: Authenticated user
- Request Body: None

---

## OpenAPI
- `GET /v3/api-docs`
- `GET /swagger-ui/index.html`

## Companion Files
- Endpoint list: `docs/backend-endpoints.md`
- JSON requests: `docs/backend-test-requests.json`
