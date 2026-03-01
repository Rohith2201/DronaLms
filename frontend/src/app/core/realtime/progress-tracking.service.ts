import { Injectable, OnDestroy } from '@angular/core';
import {
  Subject, BehaviorSubject, interval, Observable,
  debounceTime, distinctUntilChanged, switchMap, takeUntil, filter, tap
} from 'rxjs';
import { ApiService } from '../api-services/api.service';
import { LmsStateStore } from '../state-management/lms-state.store';
import { RealtimeService } from '../realtime/realtime.service';
import { ProgressUpdateRequest, Enrollment, EntityId } from '../models';

export interface VideoProgress {
  lessonId: EntityId;
  enrollmentId: EntityId;
  watchedSeconds: number;
  totalSeconds: number;
  percent: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressTrackingService implements OnDestroy {
  private destroy$ = new Subject<void>();

  /** Emits whenever video time updates */
  private videoTick$ = new Subject<VideoProgress>();

  /** Queue of pending progress saves */
  private savePending = new BehaviorSubject<ProgressUpdateRequest | null>(null);

  /** Completion threshold (%) to auto-mark lesson complete */
  private readonly COMPLETION_THRESHOLD = 90;
  /** Auto-save interval in milliseconds */
  private readonly SAVE_DEBOUNCE_MS = 5000;

  constructor(
    private api: ApiService,
    private store: LmsStateStore,
    private realtime: RealtimeService
  ) {
    this.initAutoSave();
    this.initRealtimeListener();
  }

  // ─── Called by video player every second ──────────────────
  onVideoTick(progress: VideoProgress): void {
    this.videoTick$.next(progress);
    const completed = progress.percent >= this.COMPLETION_THRESHOLD;
    this.queueSave({
      lessonId: progress.lessonId,
      watchedSeconds: progress.watchedSeconds,
      completed
    });
    if (completed) {
      this.store.markLessonCompleted(progress.lessonId);
    }
  }

  // ─── Manual lesson complete trigger ───────────────────────
  markComplete(enrollmentId: EntityId, lessonId: EntityId): Observable<Enrollment> {
    return this.api.updateProgress(enrollmentId, {
      lessonId,
      watchedSeconds: 0,
      completed: true
    }).pipe(
      tap(enrollment => {
        this.store.setActiveEnrollment(enrollment);
        this.store.applyProgressUpdate({
          enrollmentId: enrollment.id,
          lessonId,
          progressPercent: enrollment.progressPercent,
          completedLessons: enrollment.completedLessons,
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  // ─── Queue progress to debounce API calls ─────────────────
  private queueSave(req: ProgressUpdateRequest): void {
    this.savePending.next(req);
  }

  private initAutoSave(): void {
    const enrollment = this.store.activeEnrollment();
    const enrollmentId = enrollment?.id;
    if (!enrollmentId) return;

    this.savePending.pipe(
      filter(Boolean),
      debounceTime(this.SAVE_DEBOUNCE_MS),
      distinctUntilChanged((a, b) =>
        a.lessonId === b.lessonId && Math.abs(a.watchedSeconds - b.watchedSeconds) < 10
      ),
      switchMap(req => this.api.updateProgress(enrollmentId, req)),
      takeUntil(this.destroy$)
    ).subscribe(enrollment => {
      this.store.setActiveEnrollment(enrollment);
    });
  }

  private initRealtimeListener(): void {
    this.realtime.onProgressUpdate().pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.store.applyProgressUpdate(event);
    });
  }

  // ─── Video Tick stream for components ─────────────────────
  getVideoTick$(): Observable<VideoProgress> {
    return this.videoTick$.asObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
