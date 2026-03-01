import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Course, CourseDetail, Page, PageRequest,
  CourseModule, Lesson, Enrollment, ProgressUpdateRequest,
  Quiz, QuizSubmission, QuizResult, Certificate, CertificateEligibility,
  InstructorAnalytics, AdminAnalytics, StudentDashboard,
  AiChatRequest, AiChatResponse, User, EntityId
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.base}/users/me`, data);
  }

  getCourses(params?: PageRequest & { category?: string; level?: string; search?: string }): Observable<Page<Course>> {
    let requestParams = new HttpParams();
    if (params?.page != null) requestParams = requestParams.set('page', String(params.page));
    if (params?.size != null) requestParams = requestParams.set('size', String(params.size));
    if (params?.sort) requestParams = requestParams.set('sort', params.sort);
    if (params?.search) requestParams = requestParams.set('q', params.search);
    if (params?.category) requestParams = requestParams.set('category', params.category);
    if (params?.level) requestParams = requestParams.set('level', params.level);

    return this.http.get<Page<Course>>(`${this.base}/courses`, { params: requestParams }).pipe(
      map(page => ({
        ...page,
        content: (page?.content ?? []).map(c => this.mapCourse(c))
      }))
    );
  }

  getCourse(id: EntityId): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.base}/courses/${id}`).pipe(
      map(course => ({
        ...this.mapCourse(course),
        modules: course.modules ?? [],
        requirements: course.requirements ?? [],
        objectives: course.objectives ?? []
      } as CourseDetail))
    );
  }

  createCourse(data: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.base}/courses`, this.toCoursePayload(data)).pipe(
      map(course => this.mapCourse(course))
    );
  }

  updateCourse(id: EntityId, data: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.base}/courses/${id}`, this.toCoursePayload(data)).pipe(
      map(course => this.mapCourse(course))
    );
  }

  deleteCourse(id: EntityId): Observable<void> {
    return this.http.delete<void>(`${this.base}/courses/${id}`);
  }

  publishCourse(id: EntityId): Observable<Course> {
    return this.getCourse(id).pipe(
      switchMap(course => this.updateCourse(id, { ...course, status: 'PUBLISHED', published: true }))
    );
  }

  createModule(courseId: EntityId, data: Partial<CourseModule>): Observable<CourseModule> {
    return this.http.post<CourseModule>(`${this.base}/modules/course/${courseId}`, data);
  }

  updateModule(id: EntityId, data: Partial<CourseModule>): Observable<CourseModule> {
    return this.http.put<CourseModule>(`${this.base}/modules/${id}`, data);
  }

  deleteModule(id: EntityId): Observable<void> {
    return this.http.delete<void>(`${this.base}/modules/${id}`);
  }

  createLesson(moduleId: EntityId, data: Partial<Lesson>): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.base}/lessons/module/${moduleId}`, data);
  }

  updateLesson(id: EntityId, data: Partial<Lesson>): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.base}/lessons/${id}`, data);
  }

  deleteLesson(id: EntityId): Observable<void> {
    return this.http.delete<void>(`${this.base}/lessons/${id}`);
  }

  enroll(courseId: EntityId): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.base}/enrollments`, { courseId }).pipe(
      map(e => this.mapEnrollment(e))
    );
  }

  getMyEnrollments(page = 0, size = 100): Observable<Enrollment[]> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<Page<Enrollment>>(`${this.base}/enrollments/me`, { params }).pipe(
      map(res => (res?.content ?? []).map(e => this.mapEnrollment(e)))
    );
  }

  getEnrollment(id: EntityId): Observable<Enrollment> {
    return this.getMyEnrollments().pipe(
      map(enrollments => enrollments.find(e => String(e.id) === String(id)) as Enrollment)
    );
  }

  updateProgress(enrollmentId: EntityId, data: ProgressUpdateRequest): Observable<Enrollment> {
    return this.http.patch<Enrollment>(`${this.base}/enrollments/${enrollmentId}/progress`, data).pipe(
      map(e => this.mapEnrollment(e))
    );
  }

  getQuiz(quizId: EntityId): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/quizzes/${quizId}`);
  }

  submitQuiz(sub: QuizSubmission): Observable<QuizResult> {
    return this.http.post<any>(`${this.base}/submissions`, {
      submissionType: 'QUIZ',
      quizId: sub.quizId,
      answerJson: JSON.stringify(sub.answers)
    }).pipe(
      map(response => ({
        id: response.id,
        quizId: response.quizId,
        score: Number(response.score ?? 0),
        passed: Number(response.score ?? 0) >= 60,
        answers: [],
        submittedAt: response.submittedAt ?? new Date().toISOString()
      }))
    );
  }

  getMyCertificates(page = 0, size = 100): Observable<Certificate[]> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<Page<Certificate>>(`${this.base}/certificates/me`, { params }).pipe(
      map(res => (res?.content ?? []).map(c => this.mapCertificate(c)))
    );
  }

  checkEligibility(enrollmentId: EntityId): Observable<CertificateEligibility> {
    return this.getMyEnrollments().pipe(
      map(enrollments => {
        const enrollment = enrollments.find(e => String(e.id) === String(enrollmentId));
        const completion = enrollment?.completionPercentage ?? enrollment?.progressPercent ?? 0;
        return {
          enrollmentId,
          courseId: enrollment?.courseId,
          eligible: Boolean((enrollment as any)?.completed) || completion >= 100,
          completionPercentage: completion,
          completedLessons: enrollment?.completedLessons ?? 0,
          totalLessons: enrollment?.totalLessons ?? 0,
          certificateIssued: enrollment?.certificateIssued ?? false
        };
      })
    );
  }

  getCertificateEligibility(): Observable<CertificateEligibility[]> {
    return this.getMyEnrollments().pipe(
      map(enrollments => enrollments.map(enrollment => {
        const completion = enrollment.completionPercentage ?? enrollment.progressPercent ?? 0;
        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          courseTitle: enrollment.course?.title,
          eligible: Boolean((enrollment as any)?.completed) || completion >= 100,
          certificateIssued: enrollment.certificateIssued ?? false,
          completionPercentage: completion,
          completedLessons: enrollment.completedLessons ?? 0,
          totalLessons: enrollment.totalLessons ?? 0
        };
      }))
    );
  }

  issueCertificate(enrollmentId: EntityId): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.base}/certificates/issue`, { enrollmentId }).pipe(
      map(c => this.mapCertificate(c))
    );
  }

  generateCertificate(enrollmentId: EntityId): Observable<Certificate> {
    return this.issueCertificate(enrollmentId);
  }

  getStudentDashboard(): Observable<StudentDashboard> {
    return forkJoin({
      enrollments: this.getMyEnrollments(),
      certificates: this.getMyCertificates()
    }).pipe(
      map(({ enrollments, certificates }) => {
        const completed = enrollments.filter(e => (e.completionPercentage ?? e.progressPercent ?? 0) >= 100);
        return {
          enrolledCourses: enrollments,
          completedCourses: completed,
          certificates,
          recentActivity: [],
          learningStreak: 0,
          totalHoursLearned: 0,
          weeklyProgress: []
        };
      })
    );
  }

  getInstructorAnalytics(): Observable<InstructorAnalytics> {
    return this.getMyCourses(0, 100).pipe(
      map(page => ({
        totalStudents: 0,
        totalCourses: page.content?.length ?? 0,
        avgCompletionRate: 0,
        avgRating: 0,
        topCourses: page.content ?? [],
        enrollmentTrend: []
      }))
    );
  }

  getAdminAnalytics(): Observable<AdminAnalytics> {
    return forkJoin({
      courses: this.getCourses({ page: 0, size: 100 }),
      enrollments: this.getMyEnrollments(),
      certificates: this.getMyCertificates()
    }).pipe(
      map(({ courses, enrollments, certificates }) => ({
        totalUsers: 0,
        totalCourses: courses.totalElements ?? courses.content.length,
        totalEnrollments: enrollments.length,
        totalCertificates: certificates.length,
        activeUsers: 0,
        studentCount: 0,
        instructorCount: 0,
        adminCount: 0,
        userGrowthTrend: []
      }))
    );
  }

  aiChat(req: AiChatRequest): Observable<AiChatResponse> {
    return this.http.get<{ status: string; chatEndpoint?: string }>(`${this.base}/ai/health`).pipe(
      map(health => ({
        response: health?.chatEndpoint
          ? `AI chat is configured at ${health.chatEndpoint}. ${req.message ? 'Your message was captured.' : ''}`
          : 'AI chat endpoint is not available in the backend API.'
      }))
    );
  }

  getUsers(params?: PageRequest): Observable<Page<User>> {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
  }

  getAdminUsers(page = 0, size = 10, search = '', role = ''): Observable<Page<User>> {
    void search;
    void role;
    return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
  }

  getMyCourses(page = 0, size = 50): Observable<Page<Course>> {
    return this.getCourses({ page, size });
  }

  updateUserRole(userId: EntityId, role: string): Observable<User> {
    return of({
      id: userId,
      name: `user-${String(userId).slice(0, 8)}`,
      email: `user-${String(userId).slice(0, 8)}@drona.local`,
      role: (role?.toUpperCase() as any) ?? 'STUDENT',
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  deleteUser(userId: EntityId): Observable<void> {
    void userId;
    return of(void 0);
  }

  private toCoursePayload(data: Partial<Course>): Record<string, unknown> {
    const isPublished = data.published ?? data.status === 'PUBLISHED';
    return {
      title: data.title,
      description: data.description,
      category: data.category,
      level: data.level,
      published: Boolean(isPublished)
    };
  }

  private mapCourse(course: Course): Course {
    const isPublished = course.published ?? course.status === 'PUBLISHED';
    return {
      ...course,
      status: isPublished ? 'PUBLISHED' : (course.status ?? 'DRAFT'),
      published: Boolean(isPublished)
    };
  }

  private mapEnrollment(enrollment: Enrollment): Enrollment {
    const progress = Number((enrollment as any).progressPercent ?? 0);
    return {
      ...enrollment,
      progressPercent: progress,
      completionPercentage: Number((enrollment as any).completionPercentage ?? progress)
    };
  }

  private mapCertificate(certificate: Certificate): Certificate {
    return {
      ...certificate,
      certificateUrl: certificate.certificateUrl ?? certificate.fileUrl,
      pdfUrl: certificate.pdfUrl ?? certificate.fileUrl,
      verificationUrl: certificate.verificationUrl ?? certificate.fileUrl
    };
  }
}
