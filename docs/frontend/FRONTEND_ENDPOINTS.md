# Frontend Endpoints (Angular)

Frontend URL: `http://localhost:4200`
API base used by app: `/api/v1` (proxied to backend)

## App Routes
- `/` (Home)
- `/verify-certificate` (Public certificate verification page)
- `/auth` (Auth layout)
- `/learn/:courseId` (Course player)
- `/403`
- `/404`

## Core API Calls Used by Frontend (`ApiService`)

### Courses
- `GET /api/v1/courses`
- `GET /api/v1/courses/{id}`
- `POST /api/v1/courses`
- `PUT /api/v1/courses/{id}`
- `DELETE /api/v1/courses/{id}`
- `GET /api/v1/courses/{courseId}/analytics`
- `GET /api/v1/courses/{courseId}/enrolled-users`

### Modules
- `POST /api/v1/modules/course/{courseId}`
- `PUT /api/v1/modules/{id}`
- `DELETE /api/v1/modules/{id}`
- `GET /api/v1/modules/course/{courseId}`

### Lessons
- `POST /api/v1/lessons/module/{moduleId}`
- `PUT /api/v1/lessons/{id}`
- `DELETE /api/v1/lessons/{id}`
- `GET /api/v1/lessons/module/{moduleId}`

### Enrollments
- `POST /api/v1/enrollments`
- `GET /api/v1/enrollments/me`
- `PATCH /api/v1/enrollments/{enrollmentId}/progress`

### Quizzes / Questions / Submissions
- `GET /api/v1/quizzes/{quizId}`
- `GET /api/v1/quizzes/module/{moduleId}`
- `POST /api/v1/quizzes/module/{moduleId}`
- `PUT /api/v1/quizzes/{quizId}`
- `DELETE /api/v1/quizzes/{quizId}`
- `GET /api/v1/questions/quiz/{quizId}`
- `POST /api/v1/questions/quiz/{quizId}`
- `PUT /api/v1/questions/{questionId}`
- `DELETE /api/v1/questions/{questionId}`
- `POST /api/v1/submissions`
- `GET /api/v1/submissions/quiz/{quizId}`
- `PATCH /api/v1/submissions/{submissionId}/grade`

### Certificates
- `GET /api/v1/certificates/me`
- `POST /api/v1/certificates/issue`
- `GET /api/v1/certificates/{certificateId}/pdf`
- `GET /api/v1/certificates/public/verify/{certificateNumber}`

### Admin / Misc
- `GET /api/v1/users`
- `PATCH /api/v1/users/{userId}/role`
- `GET /api/v1/users/analytics`
- `GET /api/v1/ai/health`

## Notes
- Frontend route guards protect private sections (`AuthGuard`, role-based checks in loaded modules).
- Public verification is intentionally accessible without login at `/verify-certificate`.
