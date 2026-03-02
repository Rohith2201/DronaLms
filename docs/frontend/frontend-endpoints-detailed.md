# Frontend API & Route Detailed Reference

Frontend URL: `http://localhost:4200`  
API base configured in frontend: `/api/v1` (proxied to backend)

## App Routes

### `GET /`
- Page: Home
- Access: Public

### `GET /verify-certificate`
- Page: Public certificate verification
- Access: Public
- Query Param (optional):
  - `cert` (certificate number)

### `GET /auth`
- Page: Auth layout (login/register)
- Access: Guest only (`GuestGuard`)

### `GET /learn/:courseId`
- Page: Course player
- Access: Authenticated (`AuthGuard`)
- Path Params:
  - `courseId` (UUID/string)

### `GET /403`
- Page: Forbidden

### `GET /404`
- Page: Not found

---

## Frontend Service Calls (`ApiService`)

### Courses

#### `getCourses(params)`
- HTTP: `GET /api/v1/courses`
- Query Params (optional): `page`, `size`, `sort`, `q`, `category`, `level`, `published`
- Request Body: None

#### `getInstructorCourses(page, size, search, published)`
- HTTP: `GET /api/v1/courses`
- Query Params:
  - `page`, `size`, `instructorEmail=me`
  - optional: `q`, `published`
- Request Body: None

#### `getCourse(id)`
- HTTP: `GET /api/v1/courses/{id}`
- Request Body: None

#### `createCourse(data)`
- HTTP: `POST /api/v1/courses`
- Request Body Example:
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

#### `updateCourse(id, data)`
- HTTP: `PUT /api/v1/courses/{id}`
- Request Body Example:
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

#### `deleteCourse(id)`
- HTTP: `DELETE /api/v1/courses/{id}`
- Request Body: None

#### `publishCourse(id)`
- Internal flow:
  1. `GET /api/v1/courses/{id}`
  2. `PUT /api/v1/courses/{id}` with `published=true`

#### `getCourseAnalytics(courseId)`
- HTTP: `GET /api/v1/courses/{courseId}/analytics`

#### `getCourseEnrolledUsers(courseId, page, size)`
- HTTP: `GET /api/v1/courses/{courseId}/enrolled-users`
- Query Params: `page`, `size`

---

### Modules

#### `createModule(courseId, data)`
- HTTP: `POST /api/v1/modules/course/{courseId}`
- Request Body Example:
```json
{
  "title": "Spring Boot Basics",
  "description": "Core fundamentals",
  "position": 1
}
```

#### `updateModule(id, data)`
- HTTP: `PUT /api/v1/modules/{id}`
- Request Body Example:
```json
{
  "title": "Spring Boot Basics Updated",
  "description": "Updated module description",
  "position": 2
}
```

#### `deleteModule(id)`
- HTTP: `DELETE /api/v1/modules/{id}`

#### `getModulesByCoursePublic(courseId)`
- HTTP: `GET /api/v1/modules/course/{courseId}`
- Query Params internally: `page=0&size=100`

---

### Lessons

#### `createLesson(moduleId, data)`
- HTTP: `POST /api/v1/lessons/module/{moduleId}`
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

#### `updateLesson(id, data)`
- HTTP: `PUT /api/v1/lessons/{id}`
- Request Body (PDF example):
```json
{
  "title": "REST API Notes",
  "contentType": "PDF",
  "videoUrl": null,
  "pdfUrl": "https://example.com/rest-api-notes.pdf",
  "contentText": null,
  "durationSeconds": 300,
  "position": 2
}
```

#### `deleteLesson(id)`
- HTTP: `DELETE /api/v1/lessons/{id}`

#### `getLessonsByModulePublic(moduleId)`
- HTTP: `GET /api/v1/lessons/module/{moduleId}`
- Query Params internally: `page=0&size=200`

---

### Enrollment & Progress

#### `enroll(courseId)`
- HTTP: `POST /api/v1/enrollments`
- Request Body:
```json
{
  "courseId": "00000000-0000-0000-0000-000000000001"
}
```

#### `getMyEnrollments(page, size)`
- HTTP: `GET /api/v1/enrollments/me`
- Query Params: `page`, `size`

#### `updateProgress(enrollmentId, data)`
- HTTP: `PATCH /api/v1/enrollments/{enrollmentId}/progress`
- Request Body:
```json
{
  "progressPercent": 75.5
}
```

---

### Quizzes / Questions / Submissions

#### `getQuiz(quizId)`
- HTTP: `GET /api/v1/quizzes/{quizId}`

#### `getQuizzesByModule(moduleId)`
- HTTP: `GET /api/v1/quizzes/module/{moduleId}`
- Query Params internally: `page=0&size=100`

#### `createQuiz(moduleId, data)`
- HTTP: `POST /api/v1/quizzes/module/{moduleId}`
- Request Body Example:
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

#### `updateQuiz(quizId, data)`
- HTTP: `PUT /api/v1/quizzes/{quizId}`

#### `deleteQuiz(quizId)`
- HTTP: `DELETE /api/v1/quizzes/{quizId}`

#### `getQuestionsByQuiz(quizId)`
- HTTP: `GET /api/v1/questions/quiz/{quizId}`
- Query Params internally: `page=0&size=200`

#### `createQuestion(quizId, data)`
- HTTP: `POST /api/v1/questions/quiz/{quizId}`
- Request Body Example:
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

#### `updateQuestion(questionId, data)`
- HTTP: `PUT /api/v1/questions/{questionId}`

#### `deleteQuestion(questionId)`
- HTTP: `DELETE /api/v1/questions/{questionId}`

#### `submitQuiz(sub)`
- HTTP: `POST /api/v1/submissions`
- Actual Request Body sent by frontend:
```json
{
  "submissionType": "QUIZ",
  "quizId": "00000000-0000-0000-0000-000000000002",
  "answerJson": "{\"q1\":\"GET\",\"q2\":\"201\"}"
}
```

#### `getQuizSubmissions(quizId, page, size)`
- HTTP: `GET /api/v1/submissions/quiz/{quizId}`
- Query Params: `page`, `size`

#### `gradeSubmission(submissionId, score, feedback)`
- HTTP: `PATCH /api/v1/submissions/{submissionId}/grade`
- Request Body:
```json
{
  "score": 88.5,
  "feedback": "Good understanding, revise status codes"
}
```

---

### Certificates

#### `getMyCertificates(page, size)`
- HTTP: `GET /api/v1/certificates/me`
- Query Params: `page`, `size`

#### `issueCertificate(enrollmentId)` / `generateCertificate(enrollmentId)`
- HTTP: `POST /api/v1/certificates/issue`
- Request Body:
```json
{
  "enrollmentId": "00000000-0000-0000-0000-000000000003"
}
```

#### `downloadCertificatePdf(certificateId)`
- HTTP: `GET /api/v1/certificates/{certificateId}/pdf`
- Response Type: `blob` (PDF)

#### `verifyCertificate(certificateNumber)`
- HTTP: `GET /api/v1/certificates/public/verify/{certificateNumber}`

---

### Admin / AI / Users

#### `getAdminAnalytics()`
- HTTP: `GET /api/v1/users/analytics`

#### `getAdminUsers(page, size, search, role)`
- HTTP: `GET /api/v1/users`
- Query Params: `page`, `size`, optional `search`, `role`

#### `updateUserRole(userId, role)`
- HTTP: `PATCH /api/v1/users/{userId}/role?role={role}`

#### `aiChat(req)`
- HTTP used by frontend currently: `GET /api/v1/ai/health`
- Note: Frontend composes a local AI response message from health endpoint data.

---

## Notes
- Private sections are guarded via `AuthGuard`; role restrictions are applied in feature modules and backend authorization.
- Public certificate verification route is `GET /verify-certificate` with optional `?cert=` query.
- Companion docs:
  - `docs/frontend/frontend-endpoints.md` (summary)
  - `docs/backend/backend-endpoints-detailed.md` (backend detailed)
  - `docs/backend/backend-test-requests.json` (backend test payloads)
