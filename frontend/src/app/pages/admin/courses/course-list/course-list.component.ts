import {
  Component, OnInit, OnDestroy, signal, inject, computed, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { AdminCoursesService } from '../../services/admin-courses.service';
import { ExportService } from '../../services/export.service';
import { AdminCourse, CourseFilterOptions } from '../../models/admin.models';
import { CourseDialogComponent } from '../course-dialog/course-dialog.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatSelectModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatChipsModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDialogModule, MatCardModule, MatBadgeModule, MatDividerModule
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit, OnDestroy {
  private coursesService = inject(AdminCoursesService);
  private exportService = inject(ExportService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Signals
  courses = signal<AdminCourse[]>([]);
  loading = signal(false);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Form controls
  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  levelControl = new FormControl('');
  statusControl = new FormControl('');

  // Table configuration
  displayedColumns = [
    'title',
    'category',
    'level',
    'enrollmentCount',
    'rating',
    'completionRate',
    'status',
    'actions'
  ];

  // Filter options
  categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Business', 'Marketing'];
  levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

  // Computed
  hasData = computed(() => this.courses().length > 0);

  ngOnInit(): void {
    this.setupSearchListener();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadCourses();
      });
  }

  loadCourses(): void {
    this.loading.set(true);

    const filters: CourseFilterOptions = {
      search: this.searchControl.value || undefined,
      category: this.categoryControl.value || undefined,
      level: this.levelControl.value || undefined,
      status: this.statusControl.value || undefined
    };

    this.coursesService.getCourses(this.pageIndex(), this.pageSize(), filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.courses.set(page.content);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCourses();
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadCourses();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.levelControl.setValue('');
    this.statusControl.setValue('');
    this.pageIndex.set(0);
    this.loadCourses();
  }

  createCourse(): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCourses();
      }
    });
  }

  editCourse(course: AdminCourse): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: { mode: 'edit', course }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCourses();
      }
    });
  }

  deleteCourse(course: AdminCourse): void {
    const message = `Are you sure you want to delete "${course.title}"?\n\nThis action cannot be undone.`;
    
    if (confirm(message)) {
      this.coursesService.deleteCourse(course.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert(`Course "${course.title}" has been successfully deleted.`);
            this.loadCourses();
          },
          error: (err) => {
            console.error('Failed to delete course:', err);
            
            // Show specific error message from backend
            const errorMessage = err.error?.message || err.message || 'Failed to delete course';
            
            if (errorMessage.includes('enrollment') || errorMessage.includes('referenced')) {
              alert(
                `Cannot delete "${course.title}":\n\n` +
                errorMessage + '\n\n' +
                'Tip: You can view and manage enrollments by clicking the "Enrolled Users" action for this course.'
              );
            } else {
              alert(`Failed to delete course: ${errorMessage}`);
            }
          }
        });
    }
  }

  viewAnalytics(course: AdminCourse): void {
    this.router.navigate(['/admin/courses', course.id, 'analytics']);
  }

  viewEnrolledUsers(course: AdminCourse): void {
    this.router.navigate(['/admin/courses', course.id, 'enrolled-users']);
  }

  exportData(format: 'CSV' | 'EXCEL'): void {
    this.exportService.exportCourses(this.courses(), format);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED': return 'primary';
      case 'DRAFT': return 'accent';
      case 'ARCHIVED': return 'warn';
      default: return '';
    }
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'BEGINNER': return 'primary';
      case 'INTERMEDIATE': return 'accent';
      case 'ADVANCED': return 'warn';
      default: return '';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}
