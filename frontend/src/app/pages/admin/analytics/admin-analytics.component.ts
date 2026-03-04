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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../../core/api-services/api.service';
import { AdminAnalytics } from '../../../core/models';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatChipsModule, MatSelectModule, MatTooltipModule, 
    MatProgressSpinnerModule, BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="admin-analytics">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Platform Analytics</h1>
          <p>Comprehensive overview of platform performance and user engagement</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="loadData()">
            <mat-icon>refresh</mat-icon>
            Refresh Data
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading analytics data...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="!loading() && error()">
        <mat-icon>error_outline</mat-icon>
        <h3>Failed to Load Analytics</h3>
        <p>{{ error() }}</p>
        <button mat-raised-button color="primary" (click)="loadData()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>

      <!-- Analytics Content -->
      <div class="analytics-content" *ngIf="!loading() && !error() && analytics()">
        <!-- Overview KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card purple">
            <div class="kpi-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ analytics()?.totalUsers || 0 | number }}</div>
              <div class="kpi-label">Total Users</div>
              <div class="kpi-trend positive" *ngIf="analytics()?.newUsersThisMonth">
                <mat-icon>add_circle</mat-icon>
                <span>+{{ analytics()?.newUsersThisMonth }} This Month</span>
              </div>
            </div>
          </div>

          <div class="kpi-card blue">
            <div class="kpi-icon">
              <mat-icon>school</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ analytics()?.totalCourses || 0 | number }}</div>
              <div class="kpi-label">Total Courses</div>
              <div class="kpi-trend">
                <mat-icon>library_books</mat-icon>
                <span>Active Catalog</span>
              </div>
            </div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-icon">
              <mat-icon>how_to_reg</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ analytics()?.totalEnrollments || 0 | number }}</div>
              <div class="kpi-label">Total Enrollments</div>
              <div class="kpi-trend positive" *ngIf="analytics()?.activeUsers">
                <mat-icon>trending_up</mat-icon>
                <span>{{ analytics()?.activeUsers }} Active</span>
              </div>
            </div>
          </div>

          <div class="kpi-card orange">
            <div class="kpi-icon">
              <mat-icon>workspace_premium</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ analytics()?.totalCertificates || 0 | number }}</div>
              <div class="kpi-label">Certificates Issued</div>
              <div class="kpi-trend" *ngIf="analytics()?.avgCompletionRate">
                <mat-icon>check_circle</mat-icon>
                <span>{{ analytics()?.avgCompletionRate | number:'1.0-0' }}% Completion</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Secondary KPIs - Engagement & Performance -->
        <div class="secondary-kpis">
          <mat-card class="metric-card">
            <div class="metric-icon teal">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ calculateAvgEnrollmentPerUser() | number:'1.1-1' }}</div>
              <div class="metric-label">Avg Enrollments per User</div>
              <div class="metric-description">Student engagement indicator</div>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon indigo">
              <mat-icon>people_outline</mat-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ calculateAvgStudentsPerCourse() | number:'1.0-0' }}</div>
              <div class="metric-label">Avg Enrollments per Course</div>
              <div class="metric-description">Course popularity metric</div>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon pink">
              <mat-icon>emoji_events</mat-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ calculateCertificationRate() | number:'1.1-1' }}%</div>
              <div class="metric-label">Certification Rate</div>
              <div class="metric-description">Completion success rate</div>
            </div>
          </mat-card>

          <mat-card class="metric-card">
            <div class="metric-icon amber">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value" *ngIf="analytics()?.platformRevenue">
                &#36;{{ (analytics()?.platformRevenue || 0) | number:'1.0-0' }}
              </div>
              <div class="metric-value" *ngIf="!analytics()?.platformRevenue">N/A</div>
              <div class="metric-label">Platform Revenue</div>
              <div class="metric-description">Total earnings (future)</div>
            </div>
          </mat-card>
        </div>

        <!-- Role Distribution & User Growth -->
        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                Role Distribution
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  [type]="'doughnut'"
                  [data]="roleDistributionData"
                  [options]="doughnutOptions">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>show_chart</mat-icon>
                User Growth Trend
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  [type]="'line'"
                  [data]="userGrowthData"
                  [options]="lineOptions">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Course Growth & AI Usage Analytics -->
        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>auto_graph</mat-icon>
                Course Growth Over Time
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  *ngIf="hasCourseGrowthData()"
                  [type]="'bar'"
                  [data]="courseGrowthData"
                  [options]="barOptions">
                </canvas>
                <div class="no-data" *ngIf="!hasCourseGrowthData()">
                  <mat-icon>info_outline</mat-icon>
                  <p>Course growth data not available</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>smart_toy</mat-icon>
                AI Usage Statistics
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  *ngIf="hasAiUsageData()"
                  [type]="'line'"
                  [data]="aiUsageData"
                  [options]="lineOptions">
                </canvas>
                <div class="no-data" *ngIf="!hasAiUsageData()">
                  <mat-icon>info_outline</mat-icon>
                  <p>AI usage data not available yet</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Engagement Insights -->
        <mat-card class="insights-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>insights</mat-icon>
              Engagement & Performance Insights
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="insights-grid">
              <div class="insight-item success" *ngIf="hasExcellentCompletionRate()">
                <mat-icon>check_circle</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Excellent Completion Rate</div>
                  <div class="insight-description">
                    {{ analytics()?.avgCompletionRate | number:'1.0-0' }}% completion rate is above industry average (65%)
                  </div>
                </div>
              </div>

              <div class="insight-item warning" *ngIf="hasLowCompletionRate()">
                <mat-icon>warning</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Low Completion Rate</div>
                  <div class="insight-description">
                    Consider reviewing course difficulty and engagement strategies
                  </div>
                </div>
              </div>

              <div class="insight-item info" *ngIf="analytics()?.newUsersThisMonth">
                <mat-icon>trending_up</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Growth Momentum</div>
                  <div class="insight-description">
                    {{ analytics()?.newUsersThisMonth }} new users this month. 
                    {{ calculateGrowthRate() }}% growth rate
                  </div>
                </div>
              </div>

              <div class="insight-item info">
                <mat-icon>school</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Instructor Ratio</div>
                  <div class="insight-description">
                    1 instructor for every {{ calculateInstructorRatio() | number:'1.0-0' }} students
                    {{ getInstructorRatioFeedback() }}
                  </div>
                </div>
              </div>

              <div class="insight-item success" *ngIf="analytics()?.totalCertificates">
                <mat-icon>workspace_premium</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Certificate Milestone</div>
                  <div class="insight-description">
                    {{ analytics()?.totalCertificates }} certificates issued, validating learning outcomes
                  </div>
                </div>
              </div>

              <div class="insight-item info">
                <mat-icon>groups</mat-icon>
                <div class="insight-content">
                  <div class="insight-title">Active Engagement</div>
                  <div class="insight-description">
                    {{ calculateEngagementPercentage() | number:'1.0-0' }}% of users actively enrolled in courses
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Statistics Breakdown -->
        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Detailed Statistics
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon student">
                  <mat-icon>school</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ analytics()?.studentCount || 0 | number }}</div>
                  <div class="stat-label">Students</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon instructor">
                  <mat-icon>person</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ analytics()?.instructorCount || 0 | number }}</div>
                  <div class="stat-label">Instructors</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon admin">
                  <mat-icon>admin_panel_settings</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ analytics()?.adminCount || 0 | number }}</div>
                  <div class="stat-label">Administrators</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon completion">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ analytics()?.avgCompletionRate || 0 | number:'1.0-0' }}%</div>
                  <div class="stat-label">Avg Completion Rate</div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .admin-analytics {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      gap: var(--space-4);

      .header-content h1 {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 var(--space-2);
      }

      .header-content p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16);
      text-align: center;
      gap: var(--space-4);

      mat-icon { 
        font-size: 72px; 
        width: 72px; 
        height: 72px;
        color: var(--text-muted); 
      }

      h3 {
        font-size: 1.25rem;
        margin: 0;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .error-container mat-icon {
      color: var(--danger);
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .kpi-card {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex;
      gap: var(--space-4);
      border: 1px solid var(--border);
      transition: all var(--transition-base);

      &:hover {
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        transform: translateY(-2px);
      }

      &.purple .kpi-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.blue .kpi-icon { background: linear-gradient(135deg, #667eea 0%, #4568dc 100%); }
      &.green .kpi-icon { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
      &.orange .kpi-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    }

    .kpi-icon {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);

      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .kpi-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .kpi-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 4px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.positive {
        color: var(--success);
        mat-icon { color: var(--success); }
      }

      &.negative {
        color: var(--danger);
        mat-icon { color: var(--danger); }
      }
    }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .chart-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 18px;
          font-weight: 600;
        }
      }

      mat-card-content {
        padding-top: var(--space-4);
      }
    }

    .chart-wrapper {
      height: 300px;
      position: relative;
    }

    /* Secondary KPIs */
    .secondary-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      transition: all var(--transition-base);

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transform: translateY(-2px);
      }
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.teal { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); }
      &.indigo { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
      &.pink { background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); }
      &.amber { background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); }
    }

    .metric-content {
      flex: 1;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }

    .metric-description {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Statistics Card */
    .stats-card {
      margin-bottom: var(--space-6);

      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    /* Insights Card */
    .insights-card {
      margin-bottom: var(--space-6);

      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-4);
      padding-top: var(--space-4);
    }

    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-surface);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        margin-top: 2px;
        flex-shrink: 0;
      }

      &.success {
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.2);
        mat-icon { color: var(--success); }
      }

      &.warning {
        background: rgba(245, 158, 11, 0.05);
        border-color: rgba(245, 158, 11, 0.2);
        mat-icon { color: var(--warning); }
      }

      &.info {
        background: rgba(59, 130, 246, 0.05);
        border-color: rgba(59, 130, 246, 0.2);
        mat-icon { color: var(--primary); }
      }
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .insight-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .no-data {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      color: var(--text-muted);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      p {
        font-size: 14px;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-5);
      padding-top: var(--space-4);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.student { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.instructor { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
      &.admin { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.completion { background: linear-gradient(135deg, #667eea 0%, #4568dc 100%); }
    }

    .stat-details {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    /* Actions Card */
    .actions-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      padding-top: var(--space-4);

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-4);
      }
    }

    @media (max-width: 768px) {
      .admin-analytics {
        padding: var(--space-4);
      }

      .page-header {
        flex-direction: column;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .secondary-kpis {
        grid-template-columns: 1fr;
      }

      .charts-row {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  analytics = signal<AdminAnalytics | null>(null);

  roleDistributionData: ChartData<'doughnut'> = {
    labels: ['Students', 'Instructors', 'Administrators'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(17, 153, 142, 0.8)',
        'rgba(240, 147, 251, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  userGrowthData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'New Users',
      data: [],
      borderColor: 'rgba(102, 126, 234, 1)',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  courseGrowthData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'New Courses',
      data: [],
      backgroundColor: 'rgba(17, 153, 142, 0.8)',
      borderColor: 'rgba(17, 153, 142, 1)',
      borderWidth: 1
    }]
  };

  aiUsageData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'AI Requests',
      data: [],
      borderColor: 'rgba(139, 92, 246, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      }
    }
  };

  lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAdminAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.updateCharts(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading admin analytics:', err);
          this.error.set(err.error?.message || 'Failed to load analytics data');
          this.loading.set(false);
        }
      });
  }

  private updateCharts(data: AdminAnalytics): void {
    // Update role distribution
    this.roleDistributionData = {
      labels: ['Students', 'Instructors', 'Administrators'],
      datasets: [{
        data: [
          data.studentCount || 0,
          data.instructorCount || 0,
          data.adminCount || 0
        ],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(17, 153, 142, 0.8)',
          'rgba(240, 147, 251, 0.8)'
        ],
        borderWidth: 0
      }]
    };

    // Update user growth trend
    if (data.userGrowthTrend && data.userGrowthTrend.length > 0) {
      this.userGrowthData = {
        labels: data.userGrowthTrend.map(t => t.month),
        datasets: [{
          label: 'New Users',
          data: data.userGrowthTrend.map(t => t.count),
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    }

    // Update course growth
    if (data.courseGrowth && data.courseGrowth.length > 0) {
      this.courseGrowthData = {
        labels: data.courseGrowth.map(c => c.date),
        datasets: [{
          label: 'New Courses',
          data: data.courseGrowth.map(c => c.count),
          backgroundColor: 'rgba(17, 153, 142, 0.8)',
          borderColor: 'rgba(17, 153, 142, 1)',
          borderWidth: 1
        }]
      };
    }

    // Update AI usage stats
    if (data.aiUsageStats && data.aiUsageStats.length > 0) {
      this.aiUsageData = {
        labels: data.aiUsageStats.map(a => a.date),
        datasets: [{
          label: 'AI Requests',
          data: data.aiUsageStats.map(a => a.requests),
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    }
  }

  // Calculation methods for additional metrics
  calculateAvgEnrollmentPerUser(): number {
    const data = this.analytics();
    if (!data || !data.totalUsers || data.totalUsers === 0) return 0;
    return (data.totalEnrollments || 0) / data.totalUsers;
  }

  calculateAvgStudentsPerCourse(): number {
    const data = this.analytics();
    if (!data || !data.totalCourses || data.totalCourses === 0) return 0;
    // Use totalEnrollments to show average enrollments per course (popularity metric)
    return (data.totalEnrollments || 0) / data.totalCourses;
  }

  calculateCertificationRate(): number {
    const data = this.analytics();
    if (!data || !data.totalEnrollments || data.totalEnrollments === 0) return 0;
    return ((data.totalCertificates || 0) / data.totalEnrollments) * 100;
  }

  calculateGrowthRate(): number {
    const data = this.analytics();
    if (!data || !data.totalUsers || data.totalUsers === 0) return 0;
    return ((data.newUsersThisMonth || 0) / data.totalUsers) * 100;
  }

  calculateInstructorRatio(): number {
    const data = this.analytics();
    if (!data || !data.instructorCount || data.instructorCount === 0) return 0;
    return (data.studentCount || 0) / data.instructorCount;
  }

  getInstructorRatioFeedback(): string {
    const ratio = this.calculateInstructorRatio();
    if (ratio === 0) return '';
    if (ratio < 20) return '(Excellent)';
    if (ratio < 50) return '(Good)';
    if (ratio < 100) return '(Acceptable)';
    return '(Consider hiring more instructors)';
  }

  calculateEngagementPercentage(): number {
    const data = this.analytics();
    if (!data || !data.totalUsers || data.totalUsers === 0) return 0;
    // Assuming active users are those with enrollments
    return ((data.activeUsers || 0) / data.totalUsers) * 100;
  }

  hasCourseGrowthData(): boolean {
    const data = this.analytics();
    return !!(data?.courseGrowth && data.courseGrowth.length > 0);
  }

  hasAiUsageData(): boolean {
    const data = this.analytics();
    return !!(data?.aiUsageStats && data.aiUsageStats.length > 0);
  }

  hasExcellentCompletionRate(): boolean {
    const rate = this.analytics()?.avgCompletionRate;
    return rate != null && rate > 70;
  }

  hasLowCompletionRate(): boolean {
    const rate = this.analytics()?.avgCompletionRate;
    return rate != null && rate < 50;
  }
}
