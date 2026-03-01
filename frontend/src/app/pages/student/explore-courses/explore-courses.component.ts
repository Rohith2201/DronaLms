import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, computed, inject
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
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { Course, EntityId } from '../../../core/models';

@Component({
  selector: 'app-explore-courses',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatChipsModule, MatCardModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="explore-courses">
      <!-- Debug Info -->
      <div style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 4px;" *ngIf="!loading()">
        <strong>Debug:</strong> Loading={{ loading() }}, Total={{ totalCourses() }}, Filtered={{ filteredCourses().length }}
      </div>

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Explore Courses</h1>
          <p class="page-subtitle">{{ totalCourses() }} course{{ totalCourses() !== 1 ? 's' : '' }} available</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchCtrl" placeholder="Search courses...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Category</mat-label>
          <mat-select [formControl]="categoryCtrl">
            <mat-option value="">All Categories</mat-option>
            <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Level</mat-label>
          <mat-select [formControl]="levelCtrl">
            <mat-option value="">All Levels</mat-option>
            <mat-option value="BEGINNER">Beginner</mat-option>
            <mat-option value="INTERMEDIATE">Intermediate</mat-option>
            <mat-option value="ADVANCED">Advanced</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading()">
        <div class="skeleton-grid">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && filteredCourses().length === 0">
        <mat-icon>school</mat-icon>
        <h3>{{ hasFilters() ? 'No courses found' : 'No courses available' }}</h3>
        <p>{{ hasFilters() ? 'Try adjusting your filters.' : 'Check back later for new courses.' }}</p>
        <button mat-stroked-button *ngIf="hasFilters()" (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Clear Filters
        </button>
      </div>

      <!-- Course Grid -->
      <div class="courses-grid" *ngIf="!loading() && filteredCourses().length > 0">
        <div class="course-card" *ngFor="let course of filteredCourses(); trackBy: trackCourse">
          <div class="card-thumb">
            <img [src]="course.thumbnailUrl || 'assets/course-placeholder.jpg'" 
                 [alt]="course.title" loading="lazy">
            <div class="thumb-overlay">
              <a mat-mini-fab color="primary" [routerLink]="['/learn', course.id]" matTooltip="View Course">
                <mat-icon>visibility</mat-icon>
              </a>
            </div>
            <div class="level-badge" [ngClass]="'level-' + (course.level?.toLowerCase() || 'beginner')">
              {{ course.level || 'Beginner' }}
            </div>
          </div>

          <div class="card-body">
            <div class="card-category">{{ course.category || 'General' }}</div>
            <h3 class="card-title">{{ course.title }}</h3>
            <p class="card-desc">{{ course.description | slice:0:100 }}{{ (course.description?.length ?? 0) > 100 ? '…' : '' }}</p>
            
            <div class="card-meta">
              <span *ngIf="course.instructorName">
                <mat-icon>person</mat-icon> {{ course.instructorName }}
              </span>
              <span *ngIf="course.lessonCount">
                <mat-icon>play_circle</mat-icon> {{ course.lessonCount }} lessons
              </span>
              <span *ngIf="course.rating">
                <mat-icon class="star-icon">star</mat-icon> {{ course.rating | number:'1.1-1' }}
              </span>
            </div>
          </div>

          <div class="card-footer">
            <div class="price">
              <span class="price-label">{{ !course.price || course.price === 0 ? 'Free' : ('$' + course.price) }}</span>
            </div>
            <button mat-flat-button color="primary" 
                    (click)="enrollCourse(course)" 
                    [disabled]="enrolling() === course.id">
              <mat-spinner diameter="20" *ngIf="enrolling() === course.id"></mat-spinner>
              <span *ngIf="enrolling() !== course.id">Enroll Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .explore-courses { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }

    .page-header { margin-bottom: var(--space-6); }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-secondary); margin: var(--space-1) 0 0; font-size: 14px; }

    .filter-bar {
      display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center;
      margin-bottom: var(--space-6);
    }
    .search-field { flex: 1; min-width: 200px; }
    .filter-select { width: 180px; }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
      .course-card:hover & img { transform: scale(1.05); }
    }

    .thumb-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity var(--transition-base);
      .course-card:hover & { opacity: 1; }
    }

    .level-badge {
      position: absolute; top: var(--space-3); right: var(--space-3);
      padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600;
      &.level-beginner { background: rgba(34,197,94,.9); color: white; }
      &.level-intermediate { background: rgba(249,115,22,.9); color: white; }
      &.level-advanced { background: rgba(239,68,68,.9); color: white; }
    }

    .card-body { padding: var(--space-5); flex: 1; display: flex; flex-direction: column; }
    .card-category { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--primary); letter-spacing: 0.05em; margin-bottom: var(--space-2); }
    .card-title { font-size: 16px; font-weight: 600; margin: 0 0 var(--space-2); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 var(--space-4); line-height: 1.5; flex: 1; }

    .card-meta {
      display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: 12px; color: var(--text-tertiary);
      span { display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      .star-icon { color: #f59e0b; }
    }

    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border);
    }

    .price { 
      .price-label { font-size: 18px; font-weight: 700; color: var(--primary); }
    }

    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-6); }
    .skeleton-card { height: 380px; border-radius: var(--radius-xl); background: var(--bg-surface); position: relative; overflow: hidden; &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent); animation: shimmer 1.5s infinite; } }
    @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

    .loading-state, .empty-state { padding: var(--space-16); }
    .empty-state { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); mat-icon { font-size: 72px; width: 72px; height: 72px; color: var(--text-tertiary); } h3 { font-size: 1.25rem; margin: 0; } p { color: var(--text-secondary); margin: 0; } }
  `]
})
export class ExploreCoursesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  enrolling = signal<EntityId | null>(null);
  allCourses = signal<Course[]>([]);

  searchCtrl = new FormControl('');
  categoryCtrl = new FormControl('');
  levelCtrl = new FormControl('');

  categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 
                'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Business', 'Marketing'];

  totalCourses = computed(() => this.allCourses().length);
  hasFilters = computed(() => !!(this.searchCtrl.value || this.categoryCtrl.value || this.levelCtrl.value));

  filteredCourses = computed(() => {
    let list = this.allCourses();
    const search = (this.searchCtrl.value || '').toLowerCase();
    const category = this.categoryCtrl.value || '';
    const level = this.levelCtrl.value || '';

    if (search) {
      list = list.filter(c => 
        c.title?.toLowerCase().includes(search) || 
        c.description?.toLowerCase().includes(search)
      );
    }
    if (category) list = list.filter(c => c.category === category);
    if (level) list = list.filter(c => c.level === level);

    return list;
  });

  ngOnInit(): void {
    // Fetch all courses for debugging - will filter by published later
    this.api.getCourses({ page: 0, size: 100, search: '' }).subscribe({
      next: (data: any) => {
        console.log('Courses API response:', data);
        const courses = (data?.content ?? data ?? []) as Course[];
        console.log('Parsed courses:', courses);
        console.log('Number of courses:', courses.length);
        this.allCourses.set(courses);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load courses:', err);
        this.loading.set(false);
      }
    });

    this.searchCtrl.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {});
  }

  enrollCourse(course: Course): void {
    if (this.enrolling()) return;
    this.enrolling.set(course.id);
    
    this.api.enroll(course.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.enrolling.set(null);
        // Navigate to the course player
        window.location.href = `/learn/${course.id}`;
      },
      error: () => {
        this.enrolling.set(null);
        alert('Failed to enroll. Please try again.');
      }
    });
  }

  clearFilters(): void {
    this.searchCtrl.reset('');
    this.categoryCtrl.reset('');
    this.levelCtrl.reset('');
  }

  trackCourse(_: number, course: Course): EntityId {
    return course.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
