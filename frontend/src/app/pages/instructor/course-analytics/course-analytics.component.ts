import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../../core/api-services/api.service';
import { EntityId } from '../../../core/models';

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatTableModule, MatProgressBarModule, MatChipsModule, BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="course-analytics">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button routerLink="/instructor/courses" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1>{{ courseTitle() }}</h1>
          <p>Course Analytics & Performance Metrics</p>
        </div>
        <a mat-stroked-button [routerLink]="['/instructor/courses', courseId, 'manage']">
          <mat-icon>edit</mat-icon> Manage Course
        </a>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" *ngIf="!loading() && analytics()">
        <div class="kpi-card blue">
          <mat-icon>people</mat-icon>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.totalEnrolled || 0 }}</div>
            <div class="kpi-label">Total Enrolled</div>
          </div>
        </div>
        <div class="kpi-card green">
          <mat-icon>check_circle</mat-icon>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.completionRate || 0 }}%</div>
            <div class="kpi-label">Completion Rate</div>
          </div>
        </div>
        <div class="kpi-card orange">
          <mat-icon>star</mat-icon>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.averageRating || 0 | number:'1.1-1' }}</div>
            <div class="kpi-label">Average Rating</div>
          </div>
        </div>
        <div class="kpi-card purple">
          <mat-icon>trending_up</mat-icon>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.averageScore || 0 | number:'1.0-0' }}%</div>
            <div class="kpi-label">Avg. Progress</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row" *ngIf="!loading() && analytics()">
        <!-- Enrollment Trend -->
        <div class="chart-card">
          <h3>Enrollment Trend</h3>
          <div class="chart-container">
            <canvas baseChart
              [data]="enrollmentChartData"
              [options]="barChartOptions"
              type="bar">
            </canvas>
          </div>
        </div>

        <!-- Progress Distribution -->
        <div class="chart-card">
          <h3>Progress Distribution</h3>
          <div class="chart-container">
            <canvas baseChart
              [data]="progressChartData"
              [options]="doughnutChartOptions"
              type="doughnut">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Enrolled Students Table -->
      <div class="students-section" *ngIf="!loading() && enrolledUsers().length">
        <h3><mat-icon>people</mat-icon> Enrolled Students ({{ enrolledUsers().length }})</h3>
        <div class="students-table">
          <table mat-table [dataSource]="enrolledUsers()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(user.name) }}</div>
                  <div>
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>Progress</th>
              <td mat-cell *matCellDef="let user">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="user.progress"></mat-progress-bar>
                  <span>{{ user.progress | number:'1.0-0' }}%</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="'status-chip ' + (user.completionStatus || 'NOT_STARTED').toLowerCase()">
                  {{ (user.completionStatus || 'NOT_STARTED').replace('_', ' ') }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="enrolledAt">
              <th mat-header-cell *matHeaderCellDef>Enrolled</th>
              <td mat-cell *matCellDef="let user">{{ user.enrolledAt | date:'mediumDate' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading()">
        <mat-icon class="spinner">hourglass_empty</mat-icon>
        <p>Loading analytics...</p>
      </div>
    </div>
  `,
  styles: [`
    .course-analytics { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }
    
    .page-header {
      display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6);
      .back-btn { margin-right: var(--space-2); }
      .header-info { flex: 1;
        h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
        p { margin: 4px 0 0; color: var(--text-secondary); }
      }
    }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);
    }

    .kpi-card {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-5); display: flex; align-items: center; gap: var(--space-4);
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.9; }
      &.blue mat-icon { color: #3b82f6; }
      &.green mat-icon { color: #10b981; }
      &.orange mat-icon { color: #f59e0b; }
      &.purple mat-icon { color: #8b5cf6; }
    border-left: 4px solid transparent;
      &.blue { border-left-color: #3b82f6; }
      &.green { border-left-color: #10b981; }
      &.orange { border-left-color: #f59e0b; }
      &.purple { border-left-color: #8b5cf6; }
    }

    .kpi-body { flex: 1; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; }
    .kpi-label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

    .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-6); }

    .chart-card {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-6);
      h3 { margin: 0 0 var(--space-4); font-size: 1rem; font-weight: 600; }
    }

    .chart-container { height: 300px; position: relative; }

    .students-section {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-6);
      h3 { display: flex; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-4);
        mat-icon { color: var(--primary); }
      }
    }

    .students-table { overflow-x: auto; }

    table { width: 100%; }
    th { font-weight: 600; color: var(--text-secondary); font-size: 13px; padding: var(--space-3) var(--space-4); }
    td { padding: var(--space-3) var(--space-4); }

    .user-cell { display: flex; align-items: center; gap: var(--space-3); }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: var(--primary);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600; flex-shrink: 0;
    }
    .user-name { font-weight: 500; }
    .user-email { font-size: 13px; color: var(--text-secondary); }

    .progress-cell { display: flex; align-items: center; gap: var(--space-3);
      mat-progress-bar { width: 100px; }
      span { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
    }

    .status-chip {
      font-size: 11px !important; height: 24px !important; font-weight: 600;
      &.completed { background: rgba(16,185,129,0.15) !important; color: var(--success) !important; }
      &.in_progress { background: rgba(245,158,11,0.15) !important; color: #f59e0b !important; }
      &.not_started { background: rgba(100,116,139,0.15) !important; color: var(--text-secondary) !important; }
    }

    .loading { padding: var(--space-16); text-align: center; color: var(--text-secondary);
      mat-icon { font-size: 48px; width: 48px; height: 48px; animation: spin 2s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    }

    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
  `]
})
export class CourseAnalyticsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  courseId!: EntityId;
  courseTitle = signal('Course Analytics');
  loading = signal(true);
  analytics = signal<any>(null);
  enrolledUsers = signal<any[]>([]);

  displayedColumns = ['name', 'progress', 'status', 'enrolledAt'];

  enrollmentChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  progressChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,.1)' } }
    }
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { padding: 12, font: { size: 12 } } } },
    cutout: '60%'
  };

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') as string;
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      analytics: this.api.getCourseAnalytics(this.courseId),
      users: this.api.getCourseEnrolledUsers(this.courseId, 0, 50).pipe(
        catchError(() => of({ content: [] }))
      )
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ analytics, users }) => {
        this.courseTitle.set(analytics.courseTitle || 'Course Analytics');
        this.analytics.set(analytics);
        this.enrolledUsers.set(users?.content ?? []);
        this.buildCharts(analytics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildCharts(data: any): void {
    // Enrollment trend - map month/date to labels
    const months = data.enrollmentTrend?.map((t: any) => t.month || t.date || '') ?? [];
    const counts = data.enrollmentTrend?.map((t: any) => t.count || 0) ?? [];
    
    this.enrollmentChartData = {
      labels: months.length > 0 ? months : ['No data'],
      datasets: [{
        label: 'Enrollments',
        data: counts.length > 0 ? counts : [0],
        backgroundColor: 'rgba(59,130,246,.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 40
      }]
    };

    // Progress distribution
    const dist = data.progressDistribution || { completed: 0, inProgress: 0, notStarted: 0 };
    this.progressChartData = {
      labels: ['Completed', 'In Progress', 'Not Started'],
      datasets: [{
        data: [
          Number(dist.completed || 0),
          Number(dist.inProgress || 0),
          Number(dist.notStarted || 0)
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
        borderWidth: 0
      }]
    };
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
