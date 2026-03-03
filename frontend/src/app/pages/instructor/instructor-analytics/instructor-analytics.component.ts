import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../../core/api-services/api.service';

@Component({
  selector: 'app-instructor-analytics',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatChipsModule, MatSelectModule, MatTooltipModule, BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="instructor-analytics">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Teaching Analytics</h1>
          <p>Comprehensive insights across all your courses</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-select">
            <mat-label>Time Period</mat-label>
            <mat-select [(value)]="selectedPeriod" (selectionChange)="loadData()">
              <mat-option value="7">Last 7 days</mat-option>
              <mat-option value="30">Last 30 days</mat-option>
              <mat-option value="90">Last 90 days</mat-option>
              <mat-option value="365">Last year</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Overview KPIs -->
      <div class="kpi-grid" *ngIf="!loading() && analytics()">
        <div class="kpi-card purple">
          <div class="kpi-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.totalCourses || 0 }}</div>
            <div class="kpi-label">Total Courses</div>
            <div class="kpi-trend positive">
              <mat-icon>trending_up</mat-icon>
              <span>{{ analytics()?.publishedCourses || 0 }} Published</span>
            </div>
          </div>
        </div>

        <div class="kpi-card blue">
          <div class="kpi-icon">
            <mat-icon>people</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.totalStudents || 0 }}</div>
            <div class="kpi-label">Total Students</div>
            <div class="kpi-trend positive">
              <mat-icon>add_circle</mat-icon>
              <span>{{ analytics()?.newStudentsThisPeriod || 0 }} New</span>
            </div>
          </div>
        </div>

        <div class="kpi-card green">
          <div class="kpi-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.avgCompletionRate || 0 | number:'1.0-0' }}%</div>
            <div class="kpi-label">Avg. Completion</div>
            <div class="kpi-trend" [class.positive]="analytics()?.completionTrend >= 0" [class.negative]="analytics()?.completionTrend < 0">
              <mat-icon>{{ analytics()?.completionTrend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              <span>{{ analytics()?.completionTrend | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>

        <div class="kpi-card orange">
          <div class="kpi-icon">
            <mat-icon>star</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.avgRating || 0 | number:'1.1-1' }}</div>
            <div class="kpi-label">Average Rating</div>
            <div class="kpi-trend">
              <mat-icon>rate_review</mat-icon>
              <span>{{ analytics()?.totalRatings || 0 }} Reviews</span>
            </div>
          </div>
        </div>

        <div class="kpi-card teal">
          <div class="kpi-icon">
            <mat-icon>quiz</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.totalQuizzes || 0 }}</div>
            <div class="kpi-label">Total Quizzes</div>
            <div class="kpi-trend">
              <mat-icon>done_all</mat-icon>
              <span>{{ analytics()?.quizAttempts || 0 }} Attempts</span>
            </div>
          </div>
        </div>

        <div class="kpi-card indigo">
          <div class="kpi-icon">
            <mat-icon>assessment</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ analytics()?.avgStudentProgress || 0 | number:'1.0-0' }}%</div>
            <div class="kpi-label">Avg. Progress</div>
            <div class="kpi-trend positive">
              <mat-icon>psychology</mat-icon>
              <span>{{ analytics()?.engagementRate || 0 | number:'1.0-0' }}% Engaged</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="!loading() && analytics()">
        <div class="chart-row-2">
          <!-- Student Growth Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                Student Growth
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas baseChart
                  [data]="studentGrowthChartData"
                  [options]="lineChartOptions"
                  type="line">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Course Performance Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>bar_chart</mat-icon>
                Course Completion Rates
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas baseChart
                  [data]="coursePerformanceChartData"
                  [options]="barChartOptions"
                  type="bar">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="chart-row-3">
          <!-- Engagement by Day -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>calendar_today</mat-icon>
                Weekly Engagement
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container-small">
                <canvas baseChart
                  [data]="engagementByDayChartData"
                  [options]="radarChartOptions"
                  type="radar">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Student Status Distribution -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                Student Status
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container-small">
                <canvas baseChart
                  [data]="studentStatusChartData"
                  [options]="doughnutChartOptions"
                  type="doughnut">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Quiz Performance -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>quiz</mat-icon>
                Quiz Performance
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container-small">
                <canvas baseChart
                  [data]="quizPerformanceChartData"
                  [options]="horizontalBarChartOptions"
                  type="bar">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Additional Analytics Row -->
        <div class="chart-row-2" style="margin-top: 24px;">
          <!-- Course Popularity -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>local_fire_department</mat-icon>
                Course Popularity
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas baseChart
                  [data]="coursePopularityChartData"
                  [options]="bubbleChartOptions"
                  type="bubble">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Learning Progress Distribution -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>insights</mat-icon>
                Progress Distribution
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas baseChart
                  [data]="progressDistributionChartData"
                  [options]="stackedBarChartOptions"
                  type="bar">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Top Courses Table -->
      <mat-card class="courses-table-card" *ngIf="!loading() && topCourses().length">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>emoji_events</mat-icon>
            Top Performing Courses
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="topCourses()">
            <ng-container matColumnDef="rank">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let course; let i = index">
                <div class="rank-badge" [class]="'rank-' + (i + 1)">{{ i + 1 }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="course">
              <th mat-header-cell *matHeaderCellDef>Course</th>
              <td mat-cell *matCellDef="let course">
                <div class="course-cell">
                  <div class="course-title">{{ course.title }}</div>
                  <div class="course-meta">{{ course.category }} • {{ course.level }}</div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="students">
              <th mat-header-cell *matHeaderCellDef>Students</th>
              <td mat-cell *matCellDef="let course">
                <div class="metric-value">
                  <mat-icon class="metric-icon">people</mat-icon>
                  {{ course.enrollmentCount }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="completion">
              <th mat-header-cell *matHeaderCellDef>Completion</th>
              <td mat-cell *matCellDef="let course">
                <div class="progress-bar-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="course.completionRate"></div>
                  </div>
                  <span class="progress-text">{{ course.completionRate | number:'1.0-0' }}%</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="rating">
              <th mat-header-cell *matHeaderCellDef>Rating</th>
              <td mat-cell *matCellDef="let course">
                <div class="rating-cell">
                  <mat-icon class="star-icon">star</mat-icon>
                  <span>{{ course.avgRating | number:'1.1-1' }}</span>
                  <span class="rating-count">({{ course.ratingCount }})</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
              <td mat-cell *matCellDef="let course" class="actions-cell">
                <button mat-icon-button [routerLink]="['/instructor/courses', course.id, 'analytics']" matTooltip="View Analytics">
                  <mat-icon>analytics</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/instructor/courses', course.id, 'manage']" matTooltip="Manage">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div class="loading" *ngIf="loading()">
        <mat-icon class="spinner">hourglass_empty</mat-icon>
        <p>Loading analytics...</p>
      </div>
    </div>
  `,
  styles: [`
    .instructor-analytics {
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
      p {
        color: rgba(255, 255, 255, 0.9);
        margin: 8px 0 0;
        font-size: 15px;
      }
    }

    .period-select {
      width: 160px;
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: white;
        border-radius: 8px;
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border-left: 4px solid;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      &.purple { border-left-color: #8b5cf6; .kpi-icon mat-icon { color: #8b5cf6; } }
      &.blue { border-left-color: #3b82f6; .kpi-icon mat-icon { color: #3b82f6; } }
      &.green { border-left-color: #10b981; .kpi-icon mat-icon { color: #10b981; } }
      &.orange { border-left-color: #f59e0b; .kpi-icon mat-icon { color: #f59e0b; } }
      &.teal { border-left-color: #14b8a6; .kpi-icon mat-icon { color: #14b8a6; } }
      &.indigo { border-left-color: #6366f1; .kpi-icon mat-icon { color: #6366f1; } }
    }

    .kpi-icon {
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .kpi-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.positive {
        color: #10b981;
        mat-icon { color: #10b981; }
      }

      &.negative {
        color: #ef4444;
        mat-icon { color: #ef4444; }
      }
    }

    .charts-section {
      margin-bottom: 32px;
    }

    .chart-row-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-row-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .chart-card {
      mat-card-header {
        margin-bottom: 16px;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;

        mat-icon {
          color: #667eea;
        }
      }
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .chart-container-small {
      height: 250px;
      position: relative;
    }

    .courses-table-card {
      mat-card-header {
        margin-bottom: 16px;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;

        mat-icon {
          color: #f59e0b;
        }
      }

      table {
        width: 100%;
      }

      th {
        font-weight: 600;
        color: #555;
        background: #f8f9fa;
        padding: 16px;
      }

      td {
        padding: 16px;
      }

      .rank-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;

        &.rank-1 { background: linear-gradient(135deg, #ffd700, #ffed4e); color: #000; }
        &.rank-2 { background: linear-gradient(135deg, #c0c0c0, #e8e8e8); color: #000; }
        &.rank-3 { background: linear-gradient(135deg, #cd7f32, #e8a87c); color: #fff; }
      }

      .course-cell {
        .course-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .course-meta {
          font-size: 12px;
          color: #666;
        }
      }

      .metric-value {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;

        .metric-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #667eea;
        }
      }

      .progress-bar-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        min-width: 100px;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }
      }

      .progress-text {
        font-size: 13px;
        font-weight: 500;
        min-width: 40px;
      }

      .rating-cell {
        display: flex;
        align-items: center;
        gap: 4px;

        .star-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #fbbf24;
        }

        .rating-count {
          font-size: 12px;
          color: #999;
        }
      }

      .actions-header {
        text-align: right;
      }

      .actions-cell {
        text-align: right;

        button {
          transition: all 0.2s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }

    .loading {
      padding: 80px 20px;
      text-align: center;
      color: #666;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    }

    @media (max-width: 900px) {
      .chart-row-2,
      .chart-row-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InstructorAnalyticsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  analytics = signal<any>(null);
  topCourses = signal<any[]>([]);
  selectedPeriod = '30';

  displayedColumns = ['rank', 'course', 'students', 'completion', 'rating', 'actions'];

  // Chart data
  studentGrowthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  coursePerformanceChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  engagementByDayChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  studentStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  quizPerformanceChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  coursePopularityChartData: ChartData<'bubble'> = { labels: [], datasets: [] };
  progressDistributionChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Chart options
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,.1)' } }
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(100,116,139,.1)' } }
    }
  };

  radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    cutout: '60%'
  };

  horizontalBarChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { beginAtZero: true, max: 100, grid: { color: 'rgba(100,116,139,.1)' } },
      y: { grid: { display: false } }
    }
  };

  bubbleChartOptions: ChartConfiguration<'bubble'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.raw.label || '';
            return `${label}: ${context.raw.y} students, ${context.raw.x}% completion`;
          }
        }
      }
    },
    scales: {
      x: { 
        title: { display: true, text: 'Completion Rate (%)' },
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(100,116,139,.1)' }
      },
      y: { 
        title: { display: true, text: 'Total Students' },
        beginAtZero: true,
        grid: { color: 'rgba(100,116,139,.1)' }
      }
    }
  };

  stackedBarChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: { 
        stacked: true,
        grid: { display: false }
      },
      y: { 
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(100,116,139,.1)' }
      }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    this.api.getInstructorAnalytics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        console.log('Analytics data received:', data);
        this.analytics.set(data);
        this.topCourses.set(data.topCourses || []);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.loading.set(false);
      }
    });
  }

  private buildCharts(data: any): void {
    // Student Growth Chart - use actual historical data if available
    const growthData = data.studentGrowth || [];
    this.studentGrowthChartData = {
      labels: growthData.length > 0 ? growthData.map((g: any) => g.month) : ['Current'],
      datasets: [{
        label: 'Total Students',
        data: growthData.length > 0 ? growthData.map((g: any) => g.total) : [data.totalStudents || 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Course Performance - top courses completion rates
    const topCourses = (data.topCourses || []).slice(0, 5);
    this.coursePerformanceChartData = {
      labels: topCourses.map((c: any) => c.title?.substring(0, 20) || 'Course'),
      datasets: [{
        label: 'Completion Rate (%)',
        data: topCourses.map((c: any) => c.completionRate || 0),
        backgroundColor: topCourses.map((_: any, i: number) => 
          ['#667eea', '#48bb78', '#ed8936', '#38b2ac', '#9f7aea'][i % 5]
        ),
        borderRadius: 8
      }]
    };

    // Engagement by Day - use actual data if available
    const engagementByDay = data.engagementByDay || [];
    this.engagementByDayChartData = {
      labels: engagementByDay.length > 0 
        ? engagementByDay.map((e: any) => e.day)
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        label: 'Engagement %',
        data: engagementByDay.length > 0 
          ? engagementByDay.map((e: any) => e.engagement)
          : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(102,126,234,.2)',
        borderColor: '#667eea',
        borderWidth: 2
      }]
    };

    // Student Status - use actual counts
    const activeStudents = data.activeStudents || 0;
    const completedStudents = data.completedStudents || 0;
    const inactiveStudents = Math.max(0, (data.totalStudents || 0) - activeStudents - completedStudents);
    
    this.studentStatusChartData = {
      labels: ['Active', 'Completed', 'Inactive'],
      datasets: [{
        data: [activeStudents, completedStudents, inactiveStudents],
        backgroundColor: ['#3b82f6', '#10b981', '#9ca3af']
      }]
    };

    // Quiz Performance - average scores per course
    const quizCourses = topCourses.filter((c: any) => c.quizCount > 0).slice(0, 5);
    this.quizPerformanceChartData = {
      labels: quizCourses.length > 0 
        ? quizCourses.map((c: any) => c.title?.substring(0, 25) || 'Course')
        : ['No Quiz Data'],
      datasets: [{
        label: 'Avg Quiz Score (%)',
        data: quizCourses.length > 0
          ? quizCourses.map((c: any) => c.avgQuizScore || 0)
          : [0],
        backgroundColor: '#8b5cf6',
        borderRadius: 8
      }]
    };

    // Course Popularity - bubble chart showing enrollment vs completion
    this.coursePopularityChartData = {
      datasets: [{
        label: 'Courses',
        data: topCourses.map((c: any) => ({
          x: c.completionRate || 0,
          y: c.enrollmentCount || 0,
          r: Math.min(20, Math.max(5, (c.avgRating || 0) * 4)),
          label: c.title
        })),
        backgroundColor: 'rgba(102,126,234,.6)',
        borderColor: '#667eea',
        borderWidth: 2
      }]
    };

    // Progress Distribution - stacked bar showing course progress levels
    const coursesForProgress = topCourses.slice(0, 6);
    this.progressDistributionChartData = {
      labels: coursesForProgress.map((c: any) => c.title?.substring(0, 15) || 'Course'),
      datasets: [
        {
          label: 'Completed',
          data: coursesForProgress.map((c: any) => {
            const total = c.enrollmentCount || 1;
            return Math.round((c.completionRate / 100) * total);
          }),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'In Progress',
          data: coursesForProgress.map((c: any) => {
            const total = c.enrollmentCount || 1;
            const completed = Math.round((c.completionRate / 100) * total);
            return Math.max(0, total - completed);
          }),
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
