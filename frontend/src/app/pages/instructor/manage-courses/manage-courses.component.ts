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
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { Course, EntityId } from '../../../core/models';

@Component({
  selector: 'app-manage-courses',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatMenuModule, MatSelectModule, MatProgressBarModule, MatTooltipModule, MatDialogModule,
    MatTableModule, MatChipsModule, MatCardModule, MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="manage-courses">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Manage Courses</h1>
          <p class="subtitle">{{ courses().length }} course{{ courses().length !== 1 ? 's' : '' }}</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button matTooltip="Refresh" (click)="loadCourses()">
            <mat-icon>refresh</mat-icon>
          </button>
          <a mat-raised-button color="primary" routerLink="/instructor/courses/create">
            <mat-icon>add</mat-icon> Create Course
          </a>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <mat-label>Search courses...</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Title, description">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [formControl]="statusCtrl">
              <mat-option value="">All</mat-option>
              <mat-option value="draft">Draft</mat-option>
              <mat-option value="published">Published</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>Loading courses...</p>
      </div>

      <!-- Courses Table -->
      <mat-card *ngIf="!loading() && courses().length > 0" class="table-card">
        <table mat-table [dataSource]="courses()" class="courses-table">
          <!-- Course Column -->
          <ng-container matColumnDef="course">
            <th mat-header-cell *matHeaderCellDef>Course</th>
            <td mat-cell *matCellDef="let course">
              <div class="course-info">
                <div class="course-title">{{ course.title }}</div>
                <div class="course-meta-inline">
                  <span class="meta-item"><mat-icon>layers</mat-icon> {{ course.lessonCount ?? 0 }} lessons</span>
                  <span class="meta-item"><mat-icon>schedule</mat-icon> {{ getRelativeTime(course.updatedAt) }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Enrollments Column -->
          <ng-container matColumnDef="enrollments">
            <th mat-header-cell *matHeaderCellDef>Students</th>
            <td mat-cell *matCellDef="let course">
              <div class="metric-cell">
                <mat-icon class="metric-icon">people</mat-icon>
                <span class="metric-value">{{ course.enrollmentCount ?? 0 | number }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef>Rating</th>
            <td mat-cell *matCellDef="let course">
              <div class="rating-cell">
                <mat-icon class="star-icon">star</mat-icon>
                <span class="rating-value">{{ course.rating ?? 0 | number:'1.1-1' }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let course">
              <mat-chip [class]="'status-chip-' + (course.status?.toLowerCase() || 'draft')">
                {{ course.status || 'DRAFT' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
            <td mat-cell *matCellDef="let course" class="actions-cell">
              <div class="quick-actions">
                <button mat-icon-button *ngIf="course.status === 'DRAFT'" 
                        matTooltip="Publish Course" 
                        color="primary"
                        (click)="publishCourse(course)"
                        [disabled]="publishing() === course.id">
                  <mat-icon>publish</mat-icon>
                </button>
                <a mat-icon-button matTooltip="Manage Content" [routerLink]="['/instructor/courses', course.id, 'manage']">
                  <mat-icon>edit_note</mat-icon>
                </a>
                <a mat-icon-button matTooltip="View Analytics" [routerLink]="['/instructor/courses', course.id, 'analytics']">
                  <mat-icon>analytics</mat-icon>
                </a>
                <button mat-icon-button [matMenuTriggerFor]="courseMenu" matTooltip="More options">
                  <mat-icon>more_vert</mat-icon>
                </button>
              </div>
              
              <mat-menu #courseMenu="matMenu">
                <a mat-menu-item [routerLink]="['/instructor/courses', course.id, 'manage']">
                  <mat-icon>edit_note</mat-icon> Manage Content
                </a>
                <a mat-menu-item [routerLink]="['/instructor/courses', course.id, 'analytics']">
                  <mat-icon>analytics</mat-icon> Analytics
                </a>
                <button mat-menu-item (click)="duplicateCourse(course)">
                  <mat-icon>content_copy</mat-icon> Duplicate
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item class="delete-action" (click)="deleteCourse(course)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="course-row"></tr>
        </table>
      </mat-card>

      <!-- Empty State -->
      <mat-card *ngIf="!loading() && courses().length === 0" class="empty-state">
        <mat-icon>library_books</mat-icon>
        <h2>No courses found</h2>
        <p>{{ searchCtrl.value || statusCtrl.value ? 'Try a different search or filter.' : 'Create your first course to get started.' }}</p>
        <a mat-raised-button color="primary" routerLink="/instructor/courses/create" *ngIf="!searchCtrl.value && !statusCtrl.value">
          <mat-icon>add</mat-icon> Create Course
        </a>
      </mat-card>
    </div>
  `,
  styles: [`
    .manage-courses { 
      padding: 24px; 
      max-width: 1600px; 
      margin: 0 auto; 
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 32px;
      padding: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }

    .header-content {
      h1 { 
        font-size: 32px; 
        font-weight: 700; 
        margin: 0;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .subtitle { 
        color: rgba(255, 255, 255, 0.9); 
        margin: 8px 0 0; 
        font-size: 15px; 
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;

      button, a {
        background: white;
        color: #667eea;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .filters-card {
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
    }

    .filters-row { 
      display: flex; 
      gap: 16px; 
      padding: 24px;
      flex-wrap: wrap;
    }

    .search-field { 
      flex: 1; 
      min-width: 250px;
      mat-icon { color: #667eea; }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }

    .table-card {
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
    }

    .courses-table {
      width: 100%;
      background: white;

      th {
        font-weight: 600;
        color: #555;
        background: #f8f9fa;
        border-bottom: 2px solid #e0e0e0;
        padding: 16px;
      }

      td {
        padding: 16px;
      }

      .course-info {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .course-title {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 15px;
          line-height: 1.4;
        }

        .course-meta-inline {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #666;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }
          }
        }
      }

      .metric-cell {
        display: flex;
        align-items: center;
        gap: 6px;

        .metric-icon {
          color: #757575;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .metric-value {
          font-weight: 500;
          color: #1a1a1a;
        }
      }

      .rating-cell {
        display: flex;
        align-items: center;
        gap: 4px;

        .star-icon {
          color: #ffa726;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .rating-value {
          font-weight: 500;
          color: #1a1a1a;
        }
      }

      mat-chip {
        font-size: 11px;
        min-height: 24px;
        padding: 4px 8px;
        font-weight: 600;
      }

      .status-chip-published {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #065f46 !important;
      }

      .status-chip-draft {
        background: rgba(100, 116, 139, 0.15) !important;
        color: #64748b !important;
      }

      .status-chip-archived {
        background: rgba(239, 68, 68, 0.15) !important;
        color: #dc2626 !important;
      }

      .actions-header {
        text-align: right;
      }

      .actions-cell {
        text-align: right;

        .quick-actions {
          display: inline-flex;
          gap: 4px;

          button, a {
            transition: all 0.2s ease;

            &:hover {
              transform: scale(1.1);
            }
          }
        }
      }

      .course-row {
        transition: all 0.2s ease;

        &:hover {
          background: #f8f9fa;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      }
    }

    .delete-action {
      color: #d32f2f !important;

      mat-icon {
        color: #d32f2f !important;
      }

      &:hover {
        background: rgba(211, 47, 47, 0.1) !important;
      }
    }

    .empty-state { 
      text-align: center; 
      padding: 80px 20px; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 16px;
      
      mat-icon { 
        font-size: 64px; 
        width: 64px;
        height: 64px;
        color: #bbb;
      }
      
      h2 { 
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }
      
      p { 
        color: #666; 
        margin: 0;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
      }

      .search-field {
        width: 100%;
      }
    }
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

  displayedColumns = ['course', 'enrollments', 'rating', 'status', 'actions'];

  ngOnInit(): void {
    this.loadCourses();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.loadCourses());
    this.statusCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadCourses());
  }

  loadCourses(): void {
    this.loading.set(true);
    const search = this.searchCtrl.value || '';
    const status = this.statusCtrl.value || '';
    const published = status === 'published' ? true : status === 'draft' ? false : undefined;
    
    this.api.getInstructorCourses(0, 100, search, published).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => { 
        this.courses.set(data?.content ?? data ?? []); 
        this.loading.set(false); 
      },
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
