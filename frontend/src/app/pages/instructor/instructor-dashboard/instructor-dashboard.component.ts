import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, inject, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { InstructorAnalytics } from '../../../core/models';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatProgressBarModule, MatTooltipModule, BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="instructor-dashboard">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Instructor Dashboard</h1>
          <p class="page-subtitle">Welcome back! Here's how your courses are performing.</p>
        </div>
        <div class="header-actions">
          <a mat-flat-button color="primary" routerLink="/instructor/courses/create">
            <mat-icon>add</mat-icon> New Course
          </a>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="!loading() && analytics()">
        <div class="kpi-card gradient-blue">
          <div class="kpi-icon"><mat-icon>menu_book</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.totalCourses ?? 0 }}</div>
            <div class="kpi-label">Total Courses</div>
          </div>
        </div>
        <div class="kpi-card gradient-purple">
          <div class="kpi-icon"><mat-icon>people</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.totalStudents ?? 0 | number }}</div>
            <div class="kpi-label">Total Students</div>
          </div>
        </div>
        <div class="kpi-card gradient-green">
          <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.avgCompletionRate ?? 0 | number:'1.1-1' }}%</div>
            <div class="kpi-label">Avg. Completion</div>
          </div>
        </div>
        <div class="kpi-card gradient-orange">
          <div class="kpi-icon"><mat-icon>star</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ analytics()?.avgRating ?? 0 | number:'1.1-1' }}</div>
            <div class="kpi-label">Avg. Rating</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="!loading() && analytics()">
        <!-- Enrollment Trend -->
        <div class="chart-card main-chart">
          <div class="chart-header">
            <h3>Enrollment Trend</h3>
            <p>Monthly new enrollments across all courses</p>
          </div>
          <div class="chart-area">
            <canvas baseChart
              [data]="enrollmentChartData"
              [options]="enrollmentChartOptions"
              type="line">
            </canvas>
          </div>
        </div>

        <!-- Completion Rate Pie -->
        <div class="chart-card side-chart">
          <div class="chart-header">
            <h3>Completion Breakdown</h3>
          </div>
          <div class="chart-area donut-area">
            <canvas baseChart
              [data]="completionChartData"
              [options]="completionChartOptions"
              type="doughnut">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Top Courses Table -->
      <div class="top-courses-section" *ngIf="!loading() && analytics()?.topCourses?.length">
        <h3 class="section-title">
          <mat-icon>leaderboard</mat-icon> Top Performing Courses
        </h3>
        <div class="courses-table">
          <div class="table-header">
            <span class="col-title">Course</span>
            <span class="col-stat">Students</span>
            <span class="col-stat">Completion</span>
            <span class="col-stat">Rating</span>
            <span class="col-action"></span>
          </div>
          <div class="table-row" *ngFor="let course of analytics()?.topCourses; let i = index">
            <div class="col-title">
              <div class="rank-badge">{{ i + 1 }}</div>
              <div class="course-name-cell">
                <span class="course-name">{{ course.title }}</span>
                <span class="course-status {{ course.status?.toLowerCase() }}">{{ course.status }}</span>
              </div>
            </div>
            <div class="col-stat">
              <mat-icon class="stat-icon">people</mat-icon>
              {{ course.enrollmentCount | number }}
            </div>
            <div class="col-stat">
              <mat-progress-bar mode="determinate" [value]="course.completionRate" class="mini-bar"></mat-progress-bar>
              <span>{{ course.completionRate | number:'1.0-0' }}%</span>
            </div>
            <div class="col-stat">
              <mat-icon class="star-icon">star</mat-icon>
              {{ course.rating | number:'1.1-1' }}
            </div>
            <div class="col-action">
              <a mat-icon-button [routerLink]="['/instructor/courses', course.id, 'manage']" matTooltip="Manage">
                <mat-icon>edit</mat-icon>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div class="loading-skeleton" *ngIf="loading()">
        <div class="kpi-grid">
          <div class="skeleton-kpi" *ngFor="let i of [1,2,3,4]"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .instructor-dashboard { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-secondary); margin: var(--space-1) 0 0; font-size: 14px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-8); }

    .kpi-card {
      padding: var(--space-6); border-radius: var(--radius-xl);
      display: flex; align-items: center; gap: var(--space-4);
      box-shadow: var(--shadow-lg);
      &.gradient-blue   { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; }
      &.gradient-purple { background: linear-gradient(135deg, #6b21a8, #9333ea); color: white; }
      &.gradient-green  { background: linear-gradient(135deg, #065f46, #10b981); color: white; }
      &.gradient-orange { background: linear-gradient(135deg, #92400e, #f59e0b); color: white; }
    }
    .kpi-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; mat-icon { font-size: 28px; color: white; } }
    .kpi-value { font-size: 2rem; font-weight: 800; line-height: 1; }
    .kpi-label { font-size: 13px; opacity: 0.85; margin-top: 4px; }

    .charts-section { display: grid; grid-template-columns: 1fr 360px; gap: var(--space-6); margin-bottom: var(--space-8); }
    @media (max-width: 900px) { .charts-section { grid-template-columns: 1fr; } }

    .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-6); }
    .chart-header { margin-bottom: var(--space-4); h3 { font-size: 16px; font-weight: 600; margin: 0; } p { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; } }
    .chart-area { height: 260px; position: relative; }
    .donut-area { height: 260px; display: flex; align-items: center; justify-content: center; }

    .section-title { display: flex; align-items: center; gap: var(--space-2); font-size: 1.1rem; margin: 0 0 var(--space-4); mat-icon { color: var(--primary); } }

    .courses-table { background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid var(--border); overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 1fr 120px 180px 100px 60px; align-items: center; padding: var(--space-3) var(--space-5); }
    .table-header { background: var(--bg-base); font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .table-row { border-top: 1px solid var(--border); font-size: 14px; transition: background var(--transition-fast); &:hover { background: var(--bg-base); } }

    .rank-badge { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .col-title { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .course-name-cell { min-width: 0; }
    .course-name { font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .course-status { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); display: inline-block; margin-top: 2px;
      &.published { background: rgba(16,185,129,.15); color: var(--success); }
      &.draft { background: rgba(100,116,139,.15); color: var(--text-secondary); }
    }

    .col-stat { display: flex; align-items: center; gap: var(--space-2); font-size: 14px; color: var(--text-secondary); }
    .stat-icon { font-size: 16px; opacity: 0.5; }
    .star-icon { font-size: 16px; color: #f59e0b; }
    .mini-bar { width: 80px; height: 4px !important; border-radius: var(--radius-full); }

    .skeleton-kpi { height: 100px; border-radius: var(--radius-xl); background: var(--bg-surface); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  `]
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading   = signal(true);
  analytics = signal<InstructorAnalytics | null>(null);

  enrollmentChartData: ChartData<'line'> = { labels: [], datasets: [] };
  completionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  enrollmentChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,.1)' } }
    }
  };

  completionChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } },
    cutout: '65%'
  };

  ngOnInit(): void {
    this.api.getInstructorAnalytics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        this.analytics.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildCharts(data: InstructorAnalytics): void {
    const months = data.enrollmentTrend?.map((t: any) => t.month) ?? [];
    const counts  = data.enrollmentTrend?.map((t: any) => t.count) ?? [];

    this.enrollmentChartData = {
      labels: months,
      datasets: [{
        label: 'Enrollments',
        data: counts,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4
      }]
    };

    const completed  = data.completedStudents ?? 0;
    const inProgress = (data.totalStudents ?? 0) - completed;
    this.completionChartData = {
      labels: ['Completed', 'In Progress'],
      datasets: [{ data: [completed, inProgress], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0 }]
    };
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
