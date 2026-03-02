import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, delay, catchError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiService } from '../../../core/api-services/api.service';
import { 
  AdminCourse, 
  CourseAnalytics, 
  EnrolledUser, 
  CourseFormData,
  CourseFilterOptions,
  AdminDashboardStats,
  ProgressDistribution,
  PerformanceTrend,
  ScoreDistribution,
  EnrollmentTrend
} from '../models/admin.models';
import { Page, Course, EntityId } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class AdminCoursesService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private base = environment.apiUrl;

  /**
   * Get all courses with admin metrics
   */
  getCourses(
    page = 0, 
    size = 10, 
    filters?: CourseFilterOptions
  ): Observable<Page<AdminCourse>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filters?.search) {
      params = params.set('q', filters.search);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.level) {
      params = params.set('level', filters.level);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.sortBy) {
      const sort = `${filters.sortBy},${filters.sortDirection || 'asc'}`;
      params = params.set('sort', sort);
    }

    return this.http.get<Page<Course>>(`${this.base}/courses`, { params }).pipe(
      map(page => ({
        ...page,
        content: page.content.map(course => this.enrichCourseWithMetrics(course))
      })),
      catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true }))
    );
  }

  /**
   * Get single course with admin details
   */
  getCourse(courseId: EntityId): Observable<AdminCourse> {
    return this.api.getCourse(courseId).pipe(
      map(course => this.enrichCourseWithMetrics(course))
    );
  }

  /**
   * Create new course
   */
  createCourse(courseData: CourseFormData): Observable<AdminCourse> {
    return this.api.createCourse(courseData).pipe(
      map(course => this.enrichCourseWithMetrics(course))
    );
  }

  /**
   * Update existing course
   */
  updateCourse(courseId: EntityId, courseData: Partial<CourseFormData>): Observable<AdminCourse> {
    return this.api.updateCourse(courseId, courseData).pipe(
      map(course => this.enrichCourseWithMetrics(course))
    );
  }

  /**
   * Delete course
   */
  deleteCourse(courseId: EntityId): Observable<void> {
    return this.api.deleteCourse(courseId);
  }

  /**
   * Get course analytics
   */
  getCourseAnalytics(courseId: EntityId): Observable<CourseAnalytics> {
    return this.http.get<any>(`${this.base}/courses/${courseId}/analytics`).pipe(
      map(response => ({
        courseId: courseId,
        courseTitle: '', // Will be populated from course data if needed
        totalEnrolled: response.totalEnrollments || 0,
        activeLearnersCount: response.inProgressCount || 0,
        completionRate: response.completionRate || 0,
        averageScore: response.averageProgress || 0,
        averageRating: 0, // TODO: Add rating once review system is implemented
        totalRevenue: 0, // TODO: Calculate from enrollments
        progressDistribution: {
          completed: Math.round((response.completedCount / (response.totalEnrollments || 1)) * 100),
          inProgress: Math.round((response.inProgressCount / (response.totalEnrollments || 1)) * 100),
          notStarted: Math.round((response.notStartedCount / (response.totalEnrollments || 1)) * 100)
        },
        performanceTrends: [
          { date: 'Week 1', averageProgress: 25, activeUsers: response.inProgressCount || 0, completions: 0 },
          { date: 'Week 2', averageProgress: 45, activeUsers: response.inProgressCount || 0, completions: 0 },
          { date: 'Week 3', averageProgress: 70, activeUsers: response.inProgressCount || 0, completions: 0 },
          { date: 'Week 4', averageProgress: response.averageProgress || 85, activeUsers: response.inProgressCount || 0, completions: response.completedCount || 0 }
        ],
        scoreDistribution: {
          excellent: 0, // 90-100
          good: 0,      // 75-89
          average: 0,   // 60-74
          poor: 0       // 0-59
        },
        enrollmentTrend: response.enrollmentTrends || []
      }))
    );
  }

  /**
   * Get enrolled users for a course
   */
  getEnrolledUsers(
    courseId: EntityId, 
    page = 0, 
    size = 20,
    search?: string,
    sortBy?: string
  ): Observable<Page<EnrolledUser>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (search) {
      params = params.set('q', search);
    }
    if (sortBy) {
      params = params.set('sort', sortBy);
    }

    return this.http.get<any>(`${this.base}/courses/${courseId}/enrolled-users`, { params }).pipe(
      map(response => ({
        content: response.content.map((user: any) => ({
          enrollmentId: user.enrollmentId,
          userId: user.userId,
          name: user.userName,
          email: user.userEmail,
          progress: Number(user.progressPercent) || 0,
          score: 0, // TODO: Add when quiz/assessment system is implemented
          completionStatus: this.mapEnrollmentStatus(user.status),
          enrolledAt: user.enrolledAt,
          lastAccessedAt: user.enrolledAt, // TODO: Track last accessed time
          completedAt: user.completionDate,
          timeSpent: 0 // TODO: Track time spent when implemented
        })),
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        size: response.size,
        number: response.number,
        first: response.first,
        last: response.last
      }))
    );
  }
  
  private mapEnrollmentStatus(status: string): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
    switch (status) {
      case 'COMPLETED': return 'COMPLETED';
      case 'ACTIVE': return 'IN_PROGRESS';
      case 'NOT_STARTED': return 'NOT_STARTED';
      default: return 'NOT_STARTED';
    }
  }

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats(): Observable<AdminDashboardStats> {
    // TODO: Replace with actual API call
    return of({
      totalCourses: 145,
      totalUsers: 12453,
      totalInstructors: 89,
      totalEnrollments: 34567,
      totalRevenue: 567890,
      activeUsers: 8932,
      coursesPublishedThisMonth: 12,
      enrollmentsThisMonth: 2341,
      revenueGrowth: 15.4,
      userGrowth: 12.8
    }).pipe(delay(400));
  }

  /**
   * Publish course
   */
  publishCourse(courseId: EntityId): Observable<AdminCourse> {
    return this.updateCourse(courseId, { status: 'PUBLISHED' });
  }

  /**
   * Unpublish course
   */
  unpublishCourse(courseId: EntityId): Observable<AdminCourse> {
    return this.updateCourse(courseId, { status: 'DRAFT' });
  }

  /**
   * Archive course
   */
  archiveCourse(courseId: EntityId): Observable<AdminCourse> {
    return this.updateCourse(courseId, { status: 'ARCHIVED' });
  }

  // ─── Private Helper Methods ─────────────────────────────────

  /**
   * Enrich course data with admin metrics
   * Uses real backend data - no random values
   */
  private enrichCourseWithMetrics(course: Course): AdminCourse {
    const backendData = course as any;
    const enrollmentCount = backendData.enrollmentCount || 0;
    const completionRate = backendData.completionRate || 0;
    
    return {
      ...course,
      enrollmentCount,
      // Backend returns 'averageRating', frontend uses 'rating'
      rating: backendData.averageRating || course.rating || 0,
      ratingCount: backendData.ratingCount || 0,
      completionRate,
      revenue: (course.price || 0) * enrollmentCount,
      activeLearnersCount: enrollmentCount // Active learners = total enrolled for now
    };
  }
}
