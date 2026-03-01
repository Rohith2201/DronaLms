import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { Course, EntityId } from '../../../core/models';

@Component({
  selector: 'app-manage-courses',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatMenuModule, MatSelectModule, MatProgressBarModule, MatTooltipModule, MatDialogModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="manage-courses">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Manage Courses</h1>
          <p>{{ courses().length }} course{{ courses().length !== 1 ? 's' : '' }}</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/instructor/courses/create">
          <mat-icon>add</mat-icon> Create Course
        </a>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchCtrl" placeholder="Search courses...">
        </mat-form-field>
        <mat-form-field appearance="outline" class="status-select">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl">
            <mat-option value="">All</mat-option>
            <mat-option value="DRAFT">Draft</mat-option>
            <mat-option value="PUBLISHED">Published</mat-option>
            <mat-option value="ARCHIVED">Archived</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div class="skeleton-list" *ngIf="loading()">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
        <mat-icon>library_books</mat-icon>
        <h3>No courses found</h3>
        <p>{{ searchCtrl.value ? 'Try a different search.' : 'Create your first course to get started.' }}</p>
        <a mat-flat-button color="primary" routerLink="/instructor/courses/create" *ngIf="!searchCtrl.value">
          <mat-icon>add</mat-icon> Create Course
        </a>
      </div>

      <!-- Course List -->
      <div class="courses-list" *ngIf="!loading() && filtered().length > 0">
        <div class="course-row" *ngFor="let course of filtered(); trackBy: trackId">
          <img class="thumb" [src]="course.thumbnailUrl || 'assets/course-placeholder.jpg'" [alt]="course.title">

          <div class="course-info">
            <div class="course-title-row">
              <h3>{{ course.title }}</h3>
              <span class="status-chip {{ course.status?.toLowerCase() }}">{{ course.status }}</span>
            </div>
            <p class="course-desc">{{ course.description | slice:0:120 }}{{ (course.description?.length ?? 0) > 120 ? '…' : '' }}</p>
            <div class="course-meta">
              <span><mat-icon>people</mat-icon> {{ course.enrollmentCount ?? 0 | number }} students</span>
              <span><mat-icon>star</mat-icon> {{ course.rating ?? 0 | number:'1.1-1' }}</span>
              <span><mat-icon>layers</mat-icon> {{ course.lessonCount ?? 0 }} lessons</span>
              <span><mat-icon>schedule</mat-icon> Updated {{ getRelativeTime(course.updatedAt) }}</span>
            </div>
          </div>

          <div class="course-actions">
            <button mat-flat-button color="primary"
              *ngIf="course.status === 'DRAFT'"
              (click)="publishCourse(course)"
              [disabled]="publishing() === course.id">
              <mat-icon>publish</mat-icon> Publish
            </button>
            <a mat-stroked-button [routerLink]="['/instructor/courses', course.id, 'manage']">
              <mat-icon>edit</mat-icon> Manage
            </a>
            <button mat-icon-button [matMenuTriggerFor]="courseMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #courseMenu>
              <a mat-menu-item [routerLink]="['/instructor/courses', course.id, 'analytics']">
                <mat-icon>bar_chart</mat-icon> Analytics
              </a>
              <button mat-menu-item (click)="duplicateCourse(course)">
                <mat-icon>content_copy</mat-icon> Duplicate
              </button>
              <button mat-menu-item class="danger-item" (click)="deleteCourse(course)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-menu>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manage-courses { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
      p { color: var(--text-secondary); margin: 4px 0 0; font-size: 14px; }
    }

    .filter-row { display: flex; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .status-select { width: 160px; }

    .courses-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .course-row {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-5);
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
      transition: box-shadow var(--transition-base);
      &:hover { box-shadow: var(--shadow-lg); }
    }

    .thumb { width: 120px; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0; }

    .course-info { flex: 1; min-width: 0; }

    .course-title-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); flex-wrap: wrap;
      h3 { font-size: 16px; font-weight: 600; margin: 0; }
    }

    .status-chip {
      padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600;
      &.published  { background: rgba(16,185,129,.15); color: #065f46; }
      &.draft      { background: rgba(100,116,139,.15); color: var(--text-secondary); }
      &.archived   { background: rgba(239,68,68,.15);   color: #dc2626; }
    }

    .course-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 var(--space-3); line-height: 1.5; }

    .course-meta {
      display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: 12px; color: var(--text-tertiary);
      span { display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 14px; }
    }

    .course-actions { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }

    .danger-item { color: var(--danger) !important; mat-icon { color: var(--danger) !important; } }

    .skeleton-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .skeleton-row { height: 120px; border-radius: var(--radius-xl); background: var(--bg-surface); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

    .empty-state { text-align: center; padding: var(--space-16); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); mat-icon { font-size: 72px; color: var(--text-tertiary); } h3 { font-size: 1.25rem; } p { color: var(--text-secondary); } }
  `]
})
export class ManageCoursesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading   = signal(true);
  courses   = signal<Course[]>([]);
  publishing = signal<EntityId | null>(null);

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');

  get filtered(): () => Course[] {
    return () => {
      let list = this.courses();
      const s = (this.searchCtrl.value || '').toLowerCase();
      const st = this.statusCtrl.value || '';
      if (s) list = list.filter(c => c.title?.toLowerCase().includes(s));
      if (st) list = list.filter(c => c.status === st);
      return list;
    };
  }

  ngOnInit(): void {
    this.api.getMyCourses().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => { this.courses.set(data?.content ?? data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  publishCourse(course: Course): void {
    this.publishing.set(course.id);
    this.api.publishCourse(course.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.courses.update(list => list.map(c => c.id === course.id ? { ...c, status: 'PUBLISHED' as any } : c));
        this.publishing.set(null);
      },
      error: () => this.publishing.set(null)
    });
  }

  duplicateCourse(_course: Course): void { /* TODO */ }
  deleteCourse(_course: Course): void { /* TODO: Add confirmation dialog */ }

  getRelativeTime(iso?: string): string {
    if (!iso) return 'N/A';
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  }

  trackId(_: number, c: Course): EntityId { return c.id; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
