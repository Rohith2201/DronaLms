# Drona LMS - AI Agent Instructions

## Architecture Overview

**Microservice-ready three-tier application:**
- **Frontend**: Angular 18 (port 4200) with standalone components and signals
- **Backend**: Spring Boot 3.4 + Java 17 (port 8080) with layered architecture
- **AI Service**: FastAPI + Python (port 8000) for quiz generation, summarization, chat
- **Database**: PostgreSQL 16 with Flyway migrations (port 5432)
- **Storage**: S3-compatible object storage (planned)

**Data Flow**: Angular → Spring Boot API → PostgreSQL, with AI service integration via `/api/v1/ai/*` BFF endpoints.

## Backend (Spring Boot) Conventions

### Package Structure & Layering
```
com.drona.lms/
├── {feature}/           # Feature-based modules (course, enrollment, auth)
│   ├── controller/      # REST endpoints
│   ├── service/         # Business logic
│   └── dto/             # Request/response objects
├── domain/
│   ├── entity/          # JPA entities
│   ├── repository/      # Spring Data repositories
│   └── enums/           # Domain enums
├── security/            # JWT filters, services
├── config/              # Spring configuration
└── common/
    └── exception/       # Global exception handlers
```

**Request flow**: `Controller → Service → Repository → PostgreSQL`

### Security Patterns
- **JWT Authentication**: Stateless tokens validated by `JwtAuthenticationFilter` (extends `OncePerRequestFilter`)
- **Role-based Access**: Three roles (`STUDENT`, `INSTRUCTOR`, `ADMIN`) enforced at two levels:
  1. `SecurityConfig` HTTP security rules (URL-based)
  2. `@PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")` on methods (fine-grained)
- **Principal Injection**: Use `@AuthenticationPrincipal UserDetails principal` to get authenticated user
- **Ownership Verification**: Services check `instructor_id` matches `principal.getUsername()` for instructor-owned resources

### Database Conventions
- **Primary Keys**: UUID for all entities except `roles` (uses `BIGSERIAL`)
- **Migrations**: Flyway versioned SQL in `src/main/resources/db/migration/V{n}__description.sql`
- **Constraints**: Composite unique indexes for position fields (e.g., `UNIQUE (course_id, position)` on modules)
- **Audit Fields**: All tables have `created_at` and `updated_at` (TIMESTAMPTZ)
- **JSONB**: Used for flexible fields (e.g., `question.options`, `submission.answers`)

### Validation & DTOs
- Use Jakarta validation annotations (`@NotBlank`, `@Size`, `@Email`, `@NotNull`, `@DecimalMin`)
- DTOs for requests/responses (never expose entities directly)
- `GlobalExceptionHandler` (@RestControllerAdvice) handles validation errors centrally

### Exception Handling
Custom exceptions in `common.exception/`:
- `ResourceNotFoundException` → 404
- `BadCredentialsException` → 401
- `AccessDeniedException` → 403
- `IllegalArgumentException` → 400
- `Exception` → 500

All return consistent JSON: `{ "timestamp", "status", "error", "details"? }`

## Frontend (Angular 18) Conventions

### Component Patterns
- **Standalone Components**: All new components use `standalone: true` with explicit imports
- **Signals**: Use Angular signals for reactive state (`signal`, `computed`, `effect`)
- **Change Detection**: Prefer `ChangeDetectionStrategy.OnPush`
- **Lazy Loading**: Routes use `loadComponent: () => import('...').then(m => m.Component)`

### Authentication & Guards
- **AuthService**: Manages JWT tokens in sessionStorage/localStorage, exposes signals (`isLoggedIn`, `userRole`, `isStudent`, `isInstructor`, `isAdmin`)
- **Guards**: Three route guards in `core/guards/auth.guard.ts`:
  - `AuthGuard`: Checks authentication
  - `RoleGuard`: Verifies role from `route.data['roles']`
  - `GuestGuard`: Prevents authenticated users from accessing login/register
- **JWT Decoding**: Uses `jwt-decode` library to extract user info from token

### HTTP Interceptors
Two interceptors registered in `app.module.ts`:
1. **AuthInterceptor**: Adds `Authorization: Bearer {token}` header, handles 401 with token refresh
2. **LoadingInterceptor**: Tracks active requests, shows global loading state, displays server errors via ToastrService

### State Management
- **Component Store**: Uses `@ngrx/component-store` for local state (see `LmsStateStore`)
- **Signals**: AuthService exposes `userSignal` for reactive user state
- **Observables**: ApiService methods return observables for HTTP calls

### API Service Pattern
Centralized `ApiService` in `core/api-services/api.service.ts`:
- All backend calls go through this service
- Environment-based base URL (`environment.apiUrl`)
- Typed request/response interfaces from `core/models/`

### Routing Structure
```
/ (public home)
/auth/* (guest-only: login, register)
/student/* (STUDENT role)
/instructor/* (INSTRUCTOR role)
/admin/* (ADMIN role)
/403 (forbidden)
/404 (not found)
```

## Development Workflows

### Full Stack (Docker)
```bash
docker compose up --build
# Backend: http://localhost:8080
# AI Service: http://localhost:8000 (/docs for OpenAPI)
# PostgreSQL: localhost:5432 (drona_lms/postgres/postgres)
```

### Backend Only (Local)
```bash
cd backend
mvn spring-boot:run
# Requires PostgreSQL running (connection in application.yml)
```

### Frontend Only (Local)
```bash
cd frontend
npm install
npm start
# Uses proxy.conf.json to forward /api → http://localhost:8080
# Requires backend running
```

### Database Migrations
```bash
# Migrations run automatically on startup (Flyway)
# To create new migration: src/main/resources/db/migration/V{n}__description.sql
```

## Key Patterns to Follow

### Backend API Endpoint Design
- RESTful conventions: GET (read), POST (create), PUT (update), DELETE (delete), PATCH (partial update)
- Path params for IDs: `/api/v1/courses/{courseId}`
- Query params for filters/pagination: `?q=search&published=true&page=0&size=10`
- Role annotations: `@PreAuthorize("hasRole('STUDENT')")` or `@PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")`

### Frontend Component Structure
```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, ...],
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss']
})
export class FeatureComponent implements OnInit {
  // Signals for reactive state
  data = signal<Data[]>([]);
  loading = signal(false);
  
  constructor(private api: ApiService, private auth: AuthService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
}
```

### Backend Service Testing
Use `@WebMvcTest` for controller security tests:
```java
@WebMvcTest(controllers = CourseController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class CourseControllerSecurityTest {
    @MockBean private CourseService courseService;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Test
    @WithMockUser(username = "instructor@drona.com", roles = {"INSTRUCTOR"})
    void testInstructorAccess() { /* ... */ }
}
```

## Critical Files Reference

### Architecture Documentation
- [docs/architecture.md](docs/architecture.md) - Service boundaries, request flow
- [docs/database-schema.md](docs/database-schema.md) - DB schema overview
- [README.md](README.md) - Quick start guide

### Backend Core
- [backend/src/main/java/com/drona/lms/config/SecurityConfig.java](backend/src/main/java/com/drona/lms/config/SecurityConfig.java) - Security rules
- [backend/src/main/java/com/drona/lms/security/JwtAuthenticationFilter.java](backend/src/main/java/com/drona/lms/security/JwtAuthenticationFilter.java) - JWT filter
- [backend/src/main/java/com/drona/lms/common/exception/GlobalExceptionHandler.java](backend/src/main/java/com/drona/lms/common/exception/GlobalExceptionHandler.java) - Error handling
- [backend/src/main/resources/db/migration/](backend/src/main/resources/db/migration/) - Database migrations

### Frontend Core
- [frontend/src/app/core/auth/auth.service.ts](frontend/src/app/core/auth/auth.service.ts) - Authentication
- [frontend/src/app/core/guards/auth.guard.ts](frontend/src/app/core/guards/auth.guard.ts) - Route guards
- [frontend/src/app/core/interceptors/](frontend/src/app/core/interceptors/) - HTTP interceptors
- [frontend/src/app/core/api-services/api.service.ts](frontend/src/app/core/api-services/api.service.ts) - API client
- [frontend/proxy.conf.json](frontend/proxy.conf.json) - Development proxy

## Environment Configuration

### Backend
- `application.yml`: Database connection, JWT secret, AI service URL
- Environment variables override (see `.env.example` pattern in docker-compose)

### Frontend
- `src/environments/environment.ts`: Dev config
- `src/environments/environment.prod.ts`: Production config
- Key settings: `apiUrl`, `tokenKey`, `wsUrl`

## Common Tasks

**Add new entity**: 
1. Create migration in `db/migration/V{n}__*.sql`
2. Create JPA entity in `domain/entity/`
3. Create repository interface in `domain/repository/`
4. Create service in `{feature}/service/`
5. Create DTOs in `{feature}/dto/`
6. Create controller in `{feature}/controller/`
7. Add security rules in `SecurityConfig` or `@PreAuthorize`

**Add new frontend page**:
1. Create component with `standalone: true`
2. Add route in `app-routing.module.ts` with appropriate guards
3. Create API service method in `ApiService`
4. Use `AuthService.userSignal()` to access current user

**Test role-based access**:
- Backend: Use `@WithMockUser(roles = {"ROLE"})` in tests
- Frontend: Check guard behavior in routes with `data: {roles: ['ROLE']}`
