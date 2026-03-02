import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  Enrollment, Course, Lesson, CourseModule,
  StudentDashboard, Certificate, RealtimeProgressEvent, EntityId
} from '../models';

// ─── State Shape ────────────────────────────────────────────
export interface LmsState {
  enrollments: Enrollment[];
  activeEnrollment: Enrollment | null;
  activeCourse: Course | null;
  activeModule: CourseModule | null;
  activeLesson: Lesson | null;
  certificates: Certificate[];
  dashboard: StudentDashboard | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
}

const INITIAL_STATE: LmsState = {
  enrollments: [],
  activeEnrollment: null,
  activeCourse: null,
  activeModule: null,
  activeLesson: null,
  certificates: [],
  dashboard: null,
  sidebarCollapsed: false,
  theme: (localStorage.getItem('lms_theme') as 'light' | 'dark') || 'light',
  loading: false
};

@Injectable({ providedIn: 'root' })
export class LmsStateStore {
  // ─── Signals (primary reactive state) ─────────────────────
  private readonly _state = signal<LmsState>({ ...INITIAL_STATE });

  // Public read-only computed signals
  readonly enrollments   = computed(() => this._state().enrollments);
  readonly activeEnrollment = computed(() => this._state().activeEnrollment);
  readonly activeCourse  = computed(() => this._state().activeCourse);
  readonly activeModule  = computed(() => this._state().activeModule);
  readonly activeLesson  = computed(() => this._state().activeLesson);
  readonly certificates  = computed(() => this._state().certificates);
  readonly dashboard     = computed(() => this._state().dashboard);
  readonly sidebarCollapsed = computed(() => this._state().sidebarCollapsed);
  readonly theme         = computed(() => this._state().theme);
  readonly loading       = computed(() => this._state().loading);

  // Derived signals
  readonly continueLearnEnrollment = computed(() =>
    [...this.enrollments()].sort(
      (a, b) => new Date(b.lastAccessedAt ?? 0).getTime() - new Date(a.lastAccessedAt ?? 0).getTime()
    ).find(e => e.progressPercent < 100) ?? null
  );

  readonly activeProgress = computed(() => {
    const e = this.activeEnrollment();
    return e ? Math.round(e.progressPercent) : 0;
  });

  // BehaviorSubject for components using async pipe
  readonly progressUpdate$ = new Subject<RealtimeProgressEvent>();

  constructor() {
    // Persist theme to localStorage
    effect(() => {
      const theme = this._state().theme;
      localStorage.setItem('lms_theme', theme);
      document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    });
  }

  // ─── Mutators ──────────────────────────────────────────────
  patchState(partial: Partial<LmsState>): void {
    this._state.update(s => ({ ...s, ...partial }));
  }

  setEnrollments(enrollments: Enrollment[]): void {
    this.patchState({ enrollments });
  }

  setActiveEnrollment(active: Enrollment | null): void {
    this.patchState({ activeEnrollment: active });
  }

  setActiveCourse(course: Course | null): void {
    this.patchState({ activeCourse: course });
  }

  setActiveLesson(lesson: Lesson | null): void {
    this.patchState({ activeLesson: lesson });
  }

  setActiveModule(mod: CourseModule | null): void {
    this.patchState({ activeModule: mod });
  }

  setCertificates(certs: Certificate[]): void {
    this.patchState({ certificates: certs });
  }

  setDashboard(dash: StudentDashboard): void {
    this.patchState({ dashboard: dash });
  }

  toggleSidebar(): void {
    this.patchState({ sidebarCollapsed: !this._state().sidebarCollapsed });
  }

  toggleTheme(): void {
    const current = this._state().theme;
    this.patchState({ theme: current === 'light' ? 'dark' : 'light' });
  }

  setLoading(loading: boolean): void {
    this.patchState({ loading });
  }

  // ─── Progress Update from WebSocket ───────────────────────
  applyProgressUpdate(event: RealtimeProgressEvent): void {
    const enrollments = this.enrollments().map(e =>
      e.id === event.enrollmentId
        ? { ...e, progressPercent: event.progressPercent, completedLessons: event.completedLessons }
        : e
    );
    this.patchState({ enrollments });

    const active = this.activeEnrollment();
    if (active?.id === event.enrollmentId) {
      this.patchState({
        activeEnrollment: { ...active, progressPercent: event.progressPercent }
      });
    }

    this.progressUpdate$.next(event);
  }

  markLessonCompleted(lessonId: EntityId): void {
    const lesson = this.activeLesson();
    if (lesson?.id === lessonId) {
      this.patchState({ activeLesson: { ...lesson, isCompleted: true } });
    }
    const course = this.activeCourse();
    if (!course) return;
    // Update lesson in modules
    // This triggers chart recalculation in subscribers
  }

  reset(): void {
    this._state.set({ ...INITIAL_STATE });
  }
}
