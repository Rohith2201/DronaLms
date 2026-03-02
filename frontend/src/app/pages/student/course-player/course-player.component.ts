import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { LmsStateStore } from '../../../core/state-management/lms-state.store';
import { ProgressTrackingService, VideoProgress } from '../../../core/realtime/progress-tracking.service';
import { NotificationService } from '../../../core/realtime/notification.service';
import { CourseDetail, Lesson, Enrollment, CourseModule, EntityId } from '../../../core/models';

@Component({
  selector: 'app-course-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private api     = inject(ApiService);
  private store   = inject(LmsStateStore);
  private progress = inject(ProgressTrackingService);
  private notif   = inject(NotificationService);
  private cdr     = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  course?: CourseDetail;
  enrollment?: Enrollment;
  activeLesson?: Lesson;
  rightPanel: 'notes' | 'ai' | 'resources' = 'ai';
  sidebarOpen = signal(true);
  loading = true;

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
    this.loadCourse(courseId);
  }

  private loadCourse(courseId: EntityId): void {
    this.api.getCourse(courseId).subscribe(course => {
      this.course = course;
      this.store.setActiveCourse(course);

      // Get enrollment
      this.api.getMyEnrollments().subscribe(enrollments => {
        this.enrollment = enrollments.find(e => String(e.courseId) === String(courseId));
        if (this.enrollment) {
          this.store.setActiveEnrollment(this.enrollment);

          // Navigate to last watched lesson
          const lastId = this.enrollment.lastLessonId;
          if (lastId) {
            this.loadLesson(lastId);
          } else {
            const firstLesson = course.modules[0]?.lessons[0];
            if (firstLesson) this.loadLesson(firstLesson.id);
          }
        }
        this.loading = false;
        this.cdr.markForCheck();
      });
    });
  }

  loadLesson(lessonId: EntityId): void {
    if (!this.course) return;
    for (const mod of this.course.modules) {
      const lesson = mod.lessons.find(l => l.id === lessonId);
      if (lesson) {
        this.activeLesson = lesson;
        this.store.setActiveLesson(lesson);
        this.store.setActiveModule(mod);
        this.cdr.markForCheck();
        return;
      }
    }
  }

  onVideoProgress(vp: VideoProgress): void {
    this.progress.onVideoTick(vp);
  }

  onLessonComplete(): void {
    if (!this.enrollment || !this.activeLesson) return;
    this.progress.markComplete(this.enrollment.id, this.activeLesson.id).subscribe({
      next: (updated) => {
        this.enrollment = updated;
        
        // Update the active lesson's completed status
        if (this.activeLesson) {
          this.activeLesson.isCompleted = true;
        }
        
        this.notif.success('Lesson completed! 🎉', 'Keep going!');
        this.cdr.markForCheck();

        // Auto-advance to next lesson
        setTimeout(() => this.goToNext(), 500);
      },
      error: (err) => {
        console.error('Error marking lesson complete:', err);
        this.notif.error('Failed to mark lesson complete', 'Please try again');
      }
    });
  }

  goToNext(): void {
    if (!this.course || !this.activeLesson) return;
    const allLessons = this.course.modules.flatMap(m => m.lessons);
    const idx = allLessons.findIndex(l => l.id === this.activeLesson!.id);
    if (idx >= 0 && idx < allLessons.length - 1) {
      this.loadLesson(allLessons[idx + 1].id);
    }
  }

  goToPrev(): void {
    if (!this.course || !this.activeLesson) return;
    const allLessons = this.course.modules.flatMap(m => m.lessons);
    const idx = allLessons.findIndex(l => l.id === this.activeLesson!.id);
    if (idx > 0) this.loadLesson(allLessons[idx - 1].id);
  }

  hasPrev(): boolean {
    if (!this.course || !this.activeLesson) return false;
    const all = this.course.modules.flatMap(m => m.lessons);
    return all.findIndex(l => l.id === this.activeLesson!.id) > 0;
  }

  hasNext(): boolean {
    if (!this.course || !this.activeLesson) return false;
    const all = this.course.modules.flatMap(m => m.lessons);
    const idx = all.findIndex(l => l.id === this.activeLesson!.id);
    return idx >= 0 && idx < all.length - 1;
  }

  get progressPercent(): number {
    return this.enrollment?.progressPercent ?? 0;
  }

  trackById(_: number, item: CourseModule): EntityId { return item.id; }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
