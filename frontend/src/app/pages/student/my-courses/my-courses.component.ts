import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { Enrollment, Course, EntityId } from '../../../core/models';

interface EnrolledCourse {
  enrollment: Enrollment;
  course: Course;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatChipsModule, MatMenuModule, MatProgressBarModule, MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="my-courses-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Courses</h1>
          <p class="page-subtitle">{{ totalCount() }} enrolled course{{ totalCount() !== 1 ? 's' : '' }}</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/student/explore">
          <mat-icon>search</mat-icon> Explore Courses
        </a>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchCtrl" placeholder="Search your courses...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl">
            <mat-option value="">All</mat-option>
            <mat-option value="IN_PROGRESS">In Progress</mat-option>
            <mat-option value="COMPLETED">Completed</mat-option>
            <mat-option value="NOT_STARTED">Not Started</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Sort By</mat-label>
          <mat-select [formControl]="sortCtrl">
            <mat-option value="recent">Recently Accessed</mat-option>
            <mat-option value="progress">Progress</mat-option>
            <mat-option value="title">Title</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- View Toggle -->
        <div class="view-toggle">
          <button mat-icon-button [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" matTooltip="Grid View">
            <mat-icon>grid_view</mat-icon>
          </button>
          <button mat-icon-button [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" matTooltip="List View">
            <mat-icon>view_list</mat-icon>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading()">
        <div class="skeleton-grid" [class.grid-mode]="viewMode() === 'grid'">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && filteredCourses().length === 0">
        <mat-icon>school</mat-icon>
        <h3>{{ searchCtrl.value || statusCtrl.value ? 'No matching courses' : 'No enrollments yet' }}</h3>
        <p>{{ searchCtrl.value || statusCtrl.value ? 'Try adjusting your filters.' : 'Start learning by exploring available courses.' }}</p>
        <a mat-flat-button color="primary" routerLink="/student/explore" *ngIf="!searchCtrl.value && !statusCtrl.value">
          <mat-icon>explore</mat-icon> Explore Courses
        </a>
        <button mat-stroked-button *ngIf="searchCtrl.value || statusCtrl.value" (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Clear Filters
        </button>
      </div>

      <!-- GRID VIEW -->
      <div class="courses-grid" *ngIf="!loading() && filteredCourses().length > 0 && viewMode() === 'grid'">
        <div class="course-card" *ngFor="let item of filteredCourses(); trackBy: trackCourse">
          <!-- Thumbnail -->
          <div class="card-thumb">
            <img [src]="item.course.thumbnailUrl || 'assets/course-placeholder.jpg'"
                 [alt]="item.course.title" loading="lazy">
            <div class="thumb-overlay">
              <a mat-fab color="primary" [routerLink]="['/learn', item.course.id]" class="play-btn" matTooltip="Continue Learning">
                <mat-icon>play_arrow</mat-icon>
              </a>
            </div>
            <div class="card-badge" [ngClass]="getBadgeClass(item.enrollment.completionPercentage)">
              {{ getBadgeLabel(item.enrollment.completionPercentage) }}
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <h3 class="card-title">{{ item.course.title }}</h3>
            <p class="card-instructor">{{ item.course.instructorName }}</p>

            <!-- Progress -->
            <div class="progress-section">
              <div class="progress-header">
                <span>{{ item.enrollment.completionPercentage | number:'1.0-0' }}% complete</span>
                <span>{{ item.enrollment.completedLessons }}/{{ item.enrollment.totalLessons }} lessons</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="item.enrollment.completionPercentage" [color]="getProgressColor(item.enrollment.completionPercentage)"></mat-progress-bar>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <span class="last-accessed" *ngIf="item.enrollment.lastAccessedAt">
              <mat-icon>schedule</mat-icon>
              {{ getRelativeTime(item.enrollment.lastAccessedAt) }}
            </span>
            <a mat-flat-button color="primary" [routerLink]="['/learn', item.course.id]" class="continue-btn">
              {{ item.enrollment.completionPercentage === 0 ? 'Start' : item.enrollment.completionPercentage >= 100 ? 'Review' : 'Continue' }}
            </a>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div class="courses-list" *ngIf="!loading() && filteredCourses().length > 0 && viewMode() === 'list'">
        <div class="list-item" *ngFor="let item of filteredCourses(); trackBy: trackCourse">
          <img class="list-thumb" [src]="item.course.thumbnailUrl || 'assets/course-placeholder.jpg'" [alt]="item.course.title">
          <div class="list-info">
            <h3>{{ item.course.title }}</h3>
            <p>{{ item.course.instructorName }}</p>
            <div class="list-progress">
              <mat-progress-bar mode="determinate" [value]="item.enrollment.completionPercentage" color="primary"></mat-progress-bar>
              <span>{{ item.enrollment.completionPercentage | number:'1.0-0' }}%</span>
            </div>
          </div>
          <div class="list-actions">
            <div class="card-badge" [ngClass]="getBadgeClass(item.enrollment.completionPercentage)">
              {{ getBadgeLabel(item.enrollment.completionPercentage) }}
            </div>
            <a mat-flat-button color="primary" [routerLink]="['/learn', item.course.id]">
              {{ item.enrollment.completionPercentage >= 100 ? 'Review' : 'Continue' }}
              <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-courses-page { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-6);
      flex-wrap: wrap; gap: var(--space-4);
    }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-secondary); margin: var(--space-1) 0 0; font-size: 14px; }

    .filter-bar {
      display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center;
      margin-bottom: var(--space-6);
    }
    .search-field { flex: 1; min-width: 200px; }
    .filter-select { width: 160px; }
    .view-toggle { display: flex; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-left: auto; }
    .view-toggle button { border-radius: 0; &.active { background: var(--primary); color: white; } }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-6);
    }

    .course-card {
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
      overflow: hidden;
      border: 1px solid var(--border);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      display: flex; flex-direction: column;
      &:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
    }

    .card-thumb {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-base); }
      .course-card:hover & img { transform: scale(1.04); }
    }

    .thumb-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity var(--transition-base);
      .course-card:hover & { opacity: 1; }
    }
    .play-btn { transform: scale(0.8); transition: transform var(--transition-base); .course-card:hover & { transform: scale(1); } }

    .card-badge {
      position: absolute; top: var(--space-3); left: var(--space-3);
      padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600;
      &.badge-not-started { background: rgba(71,85,105,.8); color: white; }
      &.badge-in-progress { background: rgba(245,158,11,.9); color: white; }
      &.badge-completed   { background: rgba(16,185,129,.9); color: white; }
    }

    .card-body { padding: var(--space-4); flex: 1; }
    .card-title { font-size: 15px; font-weight: 600; margin: 0 0 var(--space-1); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-instructor { font-size: 12px; color: var(--text-secondary); margin: 0 0 var(--space-4); }

    .progress-section { margin-top: auto; }
    .progress-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-2); }

    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border);
    }

    .last-accessed {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: var(--text-tertiary);
      mat-icon { font-size: 14px; }
    }

    .continue-btn { font-size: 13px !important; padding: 0 var(--space-4) !important; height: 34px !important; }

    /* List View */
    .courses-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .list-item {
      display: flex; align-items: center; gap: var(--space-4);
      background: var(--bg-surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: var(--space-4);
      transition: box-shadow var(--transition-base);
      &:hover { box-shadow: var(--shadow-lg); }
    }

    .list-thumb { width: 100px; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0; }

    .list-info { flex: 1; min-width: 0; h3 { font-size: 15px; font-weight: 600; margin: 0 0 4px; } p { font-size: 13px; color: var(--text-secondary); margin: 0 0 var(--space-3); } }

    .list-progress { display: flex; align-items: center; gap: var(--space-3); mat-progress-bar { flex: 1; } span { font-size: 12px; color: var(--text-secondary); white-space: nowrap; } }

    .list-actions { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-3); }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
    .skeleton-card { height: 320px; border-radius: var(--radius-xl); background: var(--bg-surface); position: relative; overflow: hidden; &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent); animation: shimmer 1.5s infinite; } }
    @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

    /* Empty */
    .empty-state { text-align: center; padding: var(--space-16); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); mat-icon { font-size: 72px; color: var(--text-tertiary); } h3 { font-size: 1.25rem; } p { color: var(--text-secondary); } }
  `]
})
export class MyCoursesComponent implements OnInit {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');
  sortCtrl   = new FormControl('recent');
  viewMode   = signal<'grid' | 'list'>('grid');
  loading    = signal(true);
  allCourses = signal<EnrolledCourse[]>([]);

  totalCount  = computed(() => this.allCourses().length);
  filteredCourses = computed(() => {
    let list = this.allCourses();
    const search = (this.searchCtrl.value || '').toLowerCase();
    const status = this.statusCtrl.value || '';
    const sort   = this.sortCtrl.value || 'recent';

    if (search) list = list.filter(i => i.course?.title?.toLowerCase().includes(search));
    if (status) {
      list = list.filter(i => {
        const p = i.enrollment.completionPercentage;
        if (status === 'COMPLETED')    return p >= 100;
        if (status === 'IN_PROGRESS')  return p > 0 && p < 100;
        if (status === 'NOT_STARTED')  return p === 0;
        return true;
      });
    }
    return [...list].sort((a, b) => {
      if (sort === 'progress') return (b.enrollment.completionPercentage ?? 0) - (a.enrollment.completionPercentage ?? 0);
      if (sort === 'title')    return (a.course?.title ?? '').localeCompare(b.course?.title ?? '');
      const aDate = a.enrollment.lastAccessedAt ? new Date(a.enrollment.lastAccessedAt).getTime() : 0;
      const bDate = b.enrollment.lastAccessedAt ? new Date(b.enrollment.lastAccessedAt).getTime() : 0;
      return bDate - aDate;
    });
  });

  ngOnInit(): void {
    this.api.getMyEnrollments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        const items = (data?.content ?? data ?? []) as any[];
        this.allCourses.set(items.map((e: any) => ({ enrollment: e, course: e.course })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.searchCtrl.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {});
  }

  clearFilters(): void {
    this.searchCtrl.reset('');
    this.statusCtrl.reset('');
  }

  getBadgeClass(pct: number): string {
    if (pct >= 100)  return 'badge-completed';
    if (pct > 0)     return 'badge-in-progress';
    return 'badge-not-started';
  }

  getBadgeLabel(pct: number): string {
    if (pct >= 100) return 'Completed';
    if (pct > 0)    return 'In Progress';
    return 'Not Started';
  }

  getProgressColor(pct: number): string {
    return pct >= 100 ? 'accent' : 'primary';
  }

  getRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = diff / 3600000;
    if (hours < 1)   return 'Just now';
    if (hours < 24)  return `${Math.floor(hours)}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)    return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  trackCourse(_: number, item: EnrolledCourse): EntityId { return item.enrollment.id; }
}
