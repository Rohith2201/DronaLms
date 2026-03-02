// ============================================================
// Admin Dashboard Models — Drona LMS
// ============================================================

import { EntityId, User, Course } from '../../../core/models';

// ─── Course Analytics ───────────────────────────────────────
export interface CourseAnalytics {
  courseId: EntityId;
  courseTitle: string;
  totalEnrolled: number;
  activeLearnersCount: number;
  completionRate: number;
  averageScore: number;
  averageRating: number;
  totalRevenue: number;
  progressDistribution: ProgressDistribution;
  performanceTrends: PerformanceTrend[];
  scoreDistribution: ScoreDistribution;
  enrollmentTrend: EnrollmentTrend[];
}

export interface ProgressDistribution {
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface PerformanceTrend {
  date: string;
  averageProgress: number;
  activeUsers: number;
  completions: number;
}

export interface ScoreDistribution {
  excellent: number;  // 90-100
  good: number;       // 75-89
  average: number;    // 60-74
  poor: number;       // 0-59
}

export interface EnrollmentTrend {
  date: string;
  count: number;
}

// ─── Enrolled User ──────────────────────────────────────────
export interface EnrolledUser {
  userId: EntityId;
  enrollmentId: EntityId;
  name: string;
  email: string;
  progress: number;
  score: number;
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  lastAccessedAt?: string;
  completedAt?: string;
  timeSpent: number; // in minutes
}

// ─── Course with Admin Metrics ──────────────────────────────
export interface AdminCourse extends Course {
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  completionRate: number;
  revenue: number;
  activeLearnersCount: number;
}

// ─── Course Form Data ───────────────────────────────────────
export interface CourseFormData {
  title: string;
  description: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  price: number;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

// ─── Export Options ─────────────────────────────────────────
export interface ExportOptions {
  format: 'CSV' | 'EXCEL';
  includeHeaders: boolean;
  filename?: string;
}

// ─── Dashboard Stats ────────────────────────────────────────
export interface AdminDashboardStats {
  totalCourses: number;
  totalUsers: number;
  totalInstructors: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsers: number;
  coursesPublishedThisMonth: number;
  enrollmentsThisMonth: number;
  revenueGrowth: number;
  userGrowth: number;
}

// ─── Filter Options ─────────────────────────────────────────
export interface CourseFilterOptions {
  search?: string;
  category?: string;
  level?: string;
  status?: string;
  minRating?: number;
  sortBy?: 'title' | 'enrollments' | 'rating' | 'createdAt' | 'revenue';
  sortDirection?: 'asc' | 'desc';
}
