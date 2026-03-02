import { 
  Component, OnInit, OnDestroy, signal, inject, computed 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { AdminCoursesService } from '../../services/admin-courses.service';
import { ExportService } from '../../services/export.service';
import { EnrolledUser } from '../../models/admin.models';

@Component({
  selector: 'app-enrolled-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ],
  templateUrl: './enrolled-users.component.html',
  styleUrls: ['./enrolled-users.component.scss']
})
export class EnrolledUsersComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesService = inject(AdminCoursesService);
  private exportService = inject(ExportService);
  private destroy$ = new Subject<void>();

  courseId = signal<string>('');
  users = signal<EnrolledUser[]>([]);
  loading = signal(false);
  totalElements = signal(0);
  pageSize = signal(20);
  pageIndex = signal(0);
  sortBy = signal<string>('enrolledAt,desc');

  searchControl = new FormControl('');

  displayedColumns = [
    'name',
    'email',
    'progress',
    'score',
    'completionStatus',
    'enrolledAt',
    'lastAccessedAt',
    'timeSpent'
  ];

  hasData = computed(() => this.users().length > 0);

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.paramMap.get('courseId') || '');
    
    if (this.courseId()) {
      this.setupSearchListener();
      this.loadEnrolledUsers();
    }
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
        this.loadEnrolledUsers();
      });
  }

  loadEnrolledUsers(): void {
    this.loading.set(true);

    this.coursesService.getEnrolledUsers(
      this.courseId(),
      this.pageIndex(),
      this.pageSize(),
      this.searchControl.value || undefined,
      this.sortBy()
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (page) => {
        this.users.set(page.content);
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
    this.loadEnrolledUsers();
  }

  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy.set(`${sort.active},${sort.direction}`);
    } else {
      this.sortBy.set('enrolledAt,desc');
    }
    this.loadEnrolledUsers();
  }

  exportUsers(format: 'CSV' | 'EXCEL'): void {
    this.exportService.exportEnrolledUsers(this.users(), format);
  }

  viewAnalytics(): void {
    this.router.navigate(['/admin/courses', this.courseId(), 'analytics']);
  }

  goBack(): void {
    this.router.navigate(['/admin/courses']);
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'COMPLETED': return 'primary';
      case 'IN_PROGRESS': return 'accent';
      case 'NOT_STARTED': return 'warn';
      default: return 'accent';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return '#4caf50';
    if (progress >= 50) return '#ffa726';
    if (progress >= 25) return '#ff9800';
    return '#e0e0e0';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#4caf50';
    if (score >= 75) return '#8bc34a';
    if (score >= 60) return '#ffc107';
    return '#f44336';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}
