// ============================================================
// Core Domain Models — Drona LMS
// ============================================================

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT' | 'PDF';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type QuizStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type CertificateStatus = 'NOT_ELIGIBLE' | 'ELIGIBLE' | 'ISSUED';
export type EntityId = string | number;

// ─── Auth ───────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  email?: string;
  roles?: string[];
  user?: User;
}

export interface JwtPayload {
  sub: string;
  roles: UserRole[];
  iat: number;
  exp: number;
  userId: EntityId;
}

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: EntityId;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  active?: boolean;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Course ─────────────────────────────────────────────────
export interface Course {
  id: EntityId;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  status?: CourseStatus;
  published?: boolean;
  price?: number;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructor?: User;
  instructorName?: string;
  enrollmentCount?: number;
  lessonCount?: number;
  totalLessons?: number;
  totalModules?: number;
  rating?: number;
  ratingCount?: number;
  completionRate?: number; // Admin metric from backend
  totalDuration?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
  requirements: string[];
  objectives: string[];
}

// ─── Module ─────────────────────────────────────────────────
export interface CourseModule {
  id: EntityId;
  courseId: EntityId;
  title: string;
  description?: string;
  order: number;
  isLocked: boolean;
  lessons: Lesson[];
  completedLessons?: number;
  totalLessons?: number;
}

// ─── Lesson ─────────────────────────────────────────────────
export interface Lesson {
  id: EntityId;
  moduleId: EntityId;
  title: string;
  type: LessonType;
  contentUrl?: string;
  textContent?: string;
  contentText?: string;  // Backend returns this field
  videoUrl?: string;
  pdfUrl?: string;
  duration: number;           // seconds
  order: number;
  isPreview: boolean;
  isCompleted?: boolean;
  watchedSeconds?: number;
  resources?: LessonResource[];
}

export interface LessonResource {
  id: EntityId;
  lessonId: EntityId;
  title: string;
  url: string;
  type: 'PDF' | 'LINK' | 'CODE';
}

// ─── Enrollment ─────────────────────────────────────────────
export interface Enrollment {
  id: EntityId;
  courseId: EntityId;
  userId: EntityId;
  course?: Course;
  status?: EnrollmentStatus;
  progressPercent: number;
  completionPercentage: number;  // alias for progressPercent (some backends return this)
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  lastLessonId?: EntityId;
  lastWatchedSeconds?: number;
  enrolledAt: string;
  completedAt?: string;
  completed?: boolean;
  completionDate?: string;
  certificateIssued?: boolean;
}

export interface ProgressUpdateRequest {
  progressPercent?: number;
  lessonId?: EntityId;
  watchedSeconds?: number;
  completed?: boolean;
}

// ─── Quiz ───────────────────────────────────────────────────
export interface Quiz {
  id: EntityId;
  lessonId: EntityId;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;          // minutes
}

export interface Question {
  id: EntityId;
  quizId: EntityId;
  text: string;
  type: 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE';
  options: QuizOption[];
  points: number;
}

export interface QuizOption {
  id: EntityId;
  text: string;
  isCorrect?: boolean;         // Only visible after submission
}

export interface QuizSubmission {
  quizId: EntityId;
  answers: { questionId: EntityId; optionIds: EntityId[] }[];
}

export interface QuizResult {
  id: EntityId;
  quizId: EntityId;
  score: number;
  passed: boolean;
  answers: { questionId: number; correct: boolean; explanation?: string }[];
  submittedAt: string;
}

// ─── Certificate ─────────────────────────────────────────────
export interface Certificate {
  id: EntityId;
  userId: EntityId;
  courseId: EntityId;
  enrollmentId?: EntityId;
  course?: Course;
  courseTitle?: string;
  issuedAt: string;
  certificateNumber?: string;
  certificateUrl?: string;
  fileUrl?: string;
  pdfUrl?: string;
  verificationUrl?: string;
  verificationCode?: string;
  // Certificate display details
  studentName?: string;
  completionDate?: string;
}

export interface CertificateEligibility {
  enrollmentId: EntityId;
  courseId?: EntityId;
  courseTitle?: string;
  eligible: boolean;
  certificateIssued?: boolean;
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  conditions?: {
    label: string;
    met: boolean;
    current: number | string;
    required: number | string;
  }[];
}

// ─── Analytics ──────────────────────────────────────────────
export interface InstructorAnalytics {
  totalStudents: number;
  completedStudents?: number;
  totalRevenue?: number;
  totalCourses: number;
  averageRating?: number;
  avgRating?: number;
  avgCompletionRate?: number;
  recentEnrollments?: Enrollment[];
  monthlyRevenue?: { month: string; revenue: number }[];
  courseCompletionRates?: { courseTitle: string; rate: number }[];
  topCourses?: (Course & { enrollmentCount?: number; completionRate?: number; rating?: number })[];
  enrollmentTrend?: { month: string; count: number }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates?: number;
  activeUsers: number;
  newUsersThisMonth?: number;
  avgCompletionRate?: number;
  platformRevenue?: number;
  studentCount?: number;
  instructorCount?: number;
  adminCount?: number;
  userGrowth?: { date: string; count: number }[];
  userGrowthTrend?: { month: string; count: number }[];
  courseGrowth?: { date: string; count: number }[];
  aiUsageStats?: { date: string; requests: number }[];
}

export interface StudentDashboard {
  enrolledCourses: Enrollment[];
  completedCourses: Enrollment[];
  certificates: Certificate[];
  recentActivity: ActivityItem[];
  learningStreak: number;
  totalHoursLearned: number;
  weeklyProgress: { day: string; minutes: number }[];
}

export interface ActivityItem {
  id: EntityId;
  type: 'LESSON_COMPLETED' | 'QUIZ_PASSED' | 'COURSE_COMPLETED' | 'CERTIFICATE_ISSUED';
  description: string;
  timestamp: string;
  courseTitle?: string;
  metadata?: Record<string, unknown>;
}

// ─── AI ─────────────────────────────────────────────────────
export interface AiChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AiChatRequest {
  message: string;
  context?: string;
  lessonId?: EntityId;
  courseId?: EntityId;
}

export interface AiChatResponse {
  message?: string;
  response?: string;
  suggestions?: string[];
  relatedTopics?: string[];
}

// ─── Pagination ─────────────────────────────────────────────
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

// ─── API Wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ─── Real-time ───────────────────────────────────────────────
export interface RealtimeProgressEvent {
  enrollmentId: EntityId;
  lessonId: EntityId;
  progressPercent: number;
  completedLessons: number;
  timestamp: string;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}
