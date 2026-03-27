import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { AdminAnalytics, User, Course } from '../../../core/models';

interface ReportData {
  users: User[];
  courses: Course[];
  analytics: AdminAnalytics | null;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatTabsModule, MatChipsModule, MatSelectModule, MatFormFieldModule,
    MatDatepickerModule, MatNativeDateModule, MatInputModule, MatProgressSpinnerModule,
    MatTooltipModule, ReactiveFormsModule
  ],
  template: `
    <div class="admin-reports">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Platform Reports</h1>
          <p>Generate and export comprehensive reports for analysis</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button (click)="loadReportData()">
            <mat-icon>refresh</mat-icon>
            Refresh Data
          </button>
          <button mat-raised-button color="primary" (click)="exportAllReports()">
            <mat-icon>download</mat-icon>
            Export All
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading report data...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="!loading() && error()">
        <mat-icon>error_outline</mat-icon>
        <h3>Failed to Load Reports</h3>
        <p>{{ error() }}</p>
        <button mat-raised-button color="primary" (click)="loadReportData()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>

      <!-- Reports Content -->
      <div class="reports-content" *ngIf="!loading() && !error()">
        <!-- Quick Stats Overview -->
        <div class="quick-stats">
          <mat-card class="stat-card">
            <mat-icon>people</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Total Users</span>
              <span class="stat-value">{{ analytics()?.totalUsers || 0 | number }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon>school</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Total Courses</span>
              <span class="stat-value">{{ analytics()?.totalCourses || 0 | number }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon>how_to_reg</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Enrollments</span>
              <span class="stat-value">{{ analytics()?.totalEnrollments || 0 | number }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon>workspace_premium</mat-icon>
            <div class="stat-info">
              <span class="stat-label">Certificates</span>
              <span class="stat-value">{{ analytics()?.totalCertificates || 0 | number }}</span>
            </div>
          </mat-card>
        </div>

        <!-- Report Tabs -->
        <mat-tab-group class="reports-tabs" animationDuration="0ms">
          <!-- User Reports -->
          <mat-tab label="User Reports">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>people</mat-icon>
                    User Statistics Report
                  </mat-card-title>
                  <button mat-icon-button (click)="exportUserReport()" matTooltip="Export User Report">
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="report-section">
                    <h3>User Distribution by Role</h3>
                    <div class="role-distribution">
                      <div class="role-item">
                        <span class="role-label">Students</span>
                        <span class="role-count">{{ analytics()?.studentCount || 0 | number }}</span>
                        <span class="role-percentage">{{ calculatePercentage(analytics()?.studentCount, analytics()?.totalUsers) }}%</span>
                      </div>
                      <div class="role-item">
                        <span class="role-label">Instructors</span>
                        <span class="role-count">{{ analytics()?.instructorCount || 0 | number }}</span>
                        <span class="role-percentage">{{ calculatePercentage(analytics()?.instructorCount, analytics()?.totalUsers) }}%</span>
                      </div>
                      <div class="role-item">
                        <span class="role-label">Administrators</span>
                        <span class="role-count">{{ analytics()?.adminCount || 0 | number }}</span>
                        <span class="role-percentage">{{ calculatePercentage(analytics()?.adminCount, analytics()?.totalUsers) }}%</span>
                      </div>
                    </div>
                  </div>

                  <div class="report-section">
                    <h3>User Growth Analysis</h3>
                    <div class="growth-metrics">
                      <div class="metric">
                        <mat-icon>trending_up</mat-icon>
                        <div>
                          <div class="metric-value">{{ analytics()?.newUsersThisMonth || 0 | number }}</div>
                          <div class="metric-label">New Users This Month</div>
                        </div>
                      </div>
                      <div class="metric">
                        <mat-icon>group_add</mat-icon>
                        <div>
                          <div class="metric-value">{{ analytics()?.activeUsers || 0 | number }}</div>
                          <div class="metric-label">Active Users</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Course Reports -->
          <mat-tab label="Course Reports">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>school</mat-icon>
                    Course Performance Report
                  </mat-card-title>
                  <button mat-icon-button (click)="exportCourseReport()" matTooltip="Export Course Report">
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="report-section">
                    <h3>Course Metrics</h3>
                    <div class="course-metrics">
                      <div class="metric-box">
                        <div class="metric-icon blue">
                          <mat-icon>library_books</mat-icon>
                        </div>
                        <div class="metric-details">
                          <div class="metric-value">{{ analytics()?.totalCourses || 0 }}</div>
                          <div class="metric-label">Total Courses</div>
                        </div>
                      </div>
                      <div class="metric-box">
                        <div class="metric-icon green">
                          <mat-icon>trending_up</mat-icon>
                        </div>
                        <div class="metric-details">
                          <div class="metric-value">{{ calculateAvgEnrollmentsPerCourse() | number:'1.0-0' }}</div>
                          <div class="metric-label">Avg Enrollments/Course</div>
                        </div>
                      </div>
                      <div class="metric-box">
                        <div class="metric-icon purple">
                          <mat-icon>star</mat-icon>
                        </div>
                        <div class="metric-details">
                          <div class="metric-value">{{ analytics()?.avgCompletionRate || 0 | number:'1.0-0' }}%</div>
                          <div class="metric-label">Avg Completion Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="report-section">
                    <h3>Course Growth Trend</h3>
                    <p class="info-text" *ngIf="!hasGrowthData()">
                      <mat-icon>info</mat-icon>
                      Course growth data will be available once historical data is collected
                    </p>
                    <div class="trend-info" *ngIf="hasGrowthData()">
                      Growth trend data available for {{ analytics()?.courseGrowth?.length || 0 }} periods
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Enrollment Reports -->
          <mat-tab label="Enrollment Reports">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>how_to_reg</mat-icon>
                    Enrollment Analytics Report
                  </mat-card-title>
                  <button mat-icon-button (click)="exportEnrollmentReport()" matTooltip="Export Enrollment Report">
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="report-section">
                    <h3>Enrollment Overview</h3>
                    <div class="enrollment-stats">
                      <div class="stat-row">
                        <span class="label">Total Enrollments</span>
                        <span class="value">{{ analytics()?.totalEnrollments || 0 | number }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="label">Average per User</span>
                        <span class="value">{{ calculateAvgEnrollmentsPerUser() | number:'1.1-1' }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="label">Completion Rate</span>
                        <span class="value">{{ analytics()?.avgCompletionRate || 0 | number:'1.0-0' }}%</span>
                      </div>
                    </div>
                  </div>

                  <div class="report-section">
                    <h3>Engagement Metrics</h3>
                    <div class="engagement-grid">
                      <div class="engagement-item success">
                        <mat-icon>check_circle</mat-icon>
                        <div>
                          <div class="big-number">{{ calculateEngagementRate() | number:'1.0-0' }}%</div>
                          <div class="label">User Engagement Rate</div>
                        </div>
                      </div>
                      <div class="engagement-item info">
                        <mat-icon>school</mat-icon>
                        <div>
                          <div class="big-number">{{ calculateInstructorRatio() | number:'1.0-0' }}</div>
                          <div class="label">Students per Instructor</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Certificate Reports -->
          <mat-tab label="Certificate Reports">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>workspace_premium</mat-icon>
                    Certificate Completion Report
                  </mat-card-title>
                  <button mat-icon-button (click)="exportCertificateReport()" matTooltip="Export Certificate Report">
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-card-header>
                <mat-card-content>
                  <div class="report-section">
                    <h3>Certificate Statistics</h3>
                    <div class="certificate-stats">
                      <div class="cert-metric">
                        <div class="cert-icon">
                          <mat-icon>workspace_premium</mat-icon>
                        </div>
                        <div class="cert-info">
                          <div class="cert-value">{{ analytics()?.totalCertificates || 0 | number }}</div>
                          <div class="cert-label">Total Certificates Issued</div>
                        </div>
                      </div>
                      <div class="cert-metric">
                        <div class="cert-icon">
                          <mat-icon>emoji_events</mat-icon>
                        </div>
                        <div class="cert-info">
                          <div class="cert-value">{{ calculateCertificationRate() | number:'1.1-1' }}%</div>
                          <div class="cert-label">Certification Success Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="report-section">
                    <h3>Completion Analysis</h3>
                    <p class="description">
                      Certificate completion rate indicates the percentage of enrollments that result in 
                      successful course completion and certificate issuance.
                    </p>
                    <div class="completion-badge" [class.success]="calculateCertificationRate() > 50" 
                         [class.warning]="calculateCertificationRate() <= 50 && calculateCertificationRate() > 0">
                      <mat-icon>{{ calculateCertificationRate() > 50 ? 'check_circle' : 'info' }}</mat-icon>
                      <span>{{ getCertificationFeedback() }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Custom Reports -->
          <mat-tab label="Custom Reports">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>settings</mat-icon>
                    Custom Report Generator
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="info-message">
                    <mat-icon>construction</mat-icon>
                    Custom report generation with date ranges and filters will be available in the next update.
                  </p>
                  <div class="coming-soon">
                    <h3>Planned Features:</h3>
                    <ul>
                      <li>Date range selection for historical reports</li>
                      <li>Filter by user role, course category, or instructor</li>
                      <li>Export in multiple formats (PDF, Excel, CSV)</li>
                      <li>Scheduled report generation and email delivery</li>
                      <li>Comparative analysis between time periods</li>
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .admin-reports {
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

      .header-actions {
        display: flex;
        gap: var(--space-3);
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

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-5);

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--primary);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    /* Report Tabs */
    .reports-tabs {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }

    .tab-content {
      padding: var(--space-5);
    }

    mat-card {
      margin-bottom: var(--space-4);
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);

      mat-card-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
    }

    .report-section {
      margin-bottom: var(--space-6);

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 var(--space-4);
      }
    }

    /* Role Distribution */
    .role-distribution {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .role-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3);
      background: var(--bg-muted);
      border-radius: var(--radius-md);

      .role-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .role-count {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary);
      }

      .role-percentage {
        font-size: 14px;
        color: var(--text-secondary);
        background: var(--bg-surface);
        padding: 4px 12px;
        border-radius: var(--radius-full);
      }
    }

    /* Growth Metrics */
    .growth-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .metric {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--bg-muted);
      border-radius: var(--radius-md);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--primary);
      }

      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .metric-label {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }

    /* Course Metrics */
    .course-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
    }

    .metric-box {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.blue { background: linear-gradient(135deg, #667eea 0%, #4568dc 100%); }
      &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
      &.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    }

    .metric-details {
      .metric-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 4px;
      }

      .metric-label {
        font-size: 11px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    /* Enrollment Stats */
    .enrollment-stats {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-3);
      border-bottom: 1px solid var(--border);

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 500;
        color: var(--text-secondary);
      }

      .value {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary);
      }
    }

    /* Engagement Grid */
    .engagement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
    }

    .engagement-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      border: 2px solid;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      .big-number {
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 4px;
      }

      .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &.success {
        background: rgba(16, 185, 129, 0.05);
        border-color: var(--success);
        color: var(--success);
      }

      &.info {
        background: rgba(59, 130, 246, 0.05);
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    /* Certificate Stats */
    .certificate-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--space-4);
    }

    .cert-metric {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-5);
      background: var(--bg-muted);
      border-radius: var(--radius-md);

      .cert-icon {
        width: 60px;
        height: 60px;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          color: white;
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      .cert-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 4px;
      }

      .cert-label {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }

    .description {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: var(--space-4);
    }

    .completion-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-weight: 600;

      &.success {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
      }

      &.warning {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }
    }

    /* Info Messages */
    .info-text {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--radius-md);
      color: var(--text-secondary);

      mat-icon {
        color: var(--primary);
      }
    }

    .trend-info {
      padding: var(--space-3);
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: rgba(245, 158, 11, 0.05);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      margin-bottom: var(--space-4);

      mat-icon {
        color: var(--warning);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .coming-soon {
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-3);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: var(--space-2) 0;
          padding-left: var(--space-5);
          position: relative;
          color: var(--text-secondary);

          &::before {
            content: '→';
            position: absolute;
            left: 0;
            color: var(--primary);
            font-weight: 700;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .admin-reports {
        padding: var(--space-4);
      }

      .page-header {
        flex-direction: column;

        .header-actions {
          width: 100%;

          button {
            flex: 1;
          }
        }
      }

      .quick-stats {
        grid-template-columns: 1fr;
      }

      .role-item {
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .course-metrics,
      .engagement-grid,
      .certificate-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminReportsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  analytics = signal<AdminAnalytics | null>(null);

  ngOnInit(): void {
    this.loadReportData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReportData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAdminAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading report data:', err);
          this.error.set(err.error?.message || 'Failed to load report data');
          this.loading.set(false);
        }
      });
  }

  // Calculation methods
  calculatePercentage(value: number | undefined, total: number | undefined): number {
    if (!value || !total || total === 0) return 0;
    return (value / total) * 100;
  }

  calculateAvgEnrollmentsPerUser(): number {
    const data = this.analytics();
    if (!data || !data.totalUsers || data.totalUsers === 0) return 0;
    return (data.totalEnrollments || 0) / data.totalUsers;
  }

  calculateAvgEnrollmentsPerCourse(): number {
    const data = this.analytics();
    if (!data || !data.totalCourses || data.totalCourses === 0) return 0;
    return (data.totalEnrollments || 0) / data.totalCourses;
  }

  calculateCertificationRate(): number {
    const data = this.analytics();
    if (!data || !data.totalEnrollments || data.totalEnrollments === 0) return 0;
    return ((data.totalCertificates || 0) / data.totalEnrollments) * 100;
  }

  calculateEngagementRate(): number {
    const data = this.analytics();
    if (!data || !data.totalUsers || data.totalUsers === 0) return 0;
    return ((data.activeUsers || 0) / data.totalUsers) * 100;
  }

  calculateInstructorRatio(): number {
    const data = this.analytics();
    if (!data || !data.instructorCount || data.instructorCount === 0) return 0;
    return (data.studentCount || 0) / data.instructorCount;
  }

  hasGrowthData(): boolean {
    const data = this.analytics();
    return !!(data?.courseGrowth && data.courseGrowth.length > 0);
  }

  getCertificationFeedback(): string {
    const rate = this.calculateCertificationRate();
    if (rate > 50) return 'Excellent certification success rate!';
    if (rate > 30) return 'Good progress on certifications';
    if (rate > 0) return 'Consider reviewing completion strategies';
    return 'Start issuing certificates to track progress';
  }

  // Export methods
  exportUserReport(): void {
    console.log('Exporting user report...');
    // TODO: Implement export functionality
    alert('User report export functionality will be implemented soon');
  }

  exportCourseReport(): void {
    console.log('Exporting course report...');
    // TODO: Implement export functionality
    alert('Course report export functionality will be implemented soon');
  }

  exportEnrollmentReport(): void {
    console.log('Exporting enrollment report...');
    // TODO: Implement export functionality
    alert('Enrollment report export functionality will be implemented soon');
  }

  exportCertificateReport(): void {
    console.log('Exporting certificate report...');
    // TODO: Implement export functionality
    alert('Certificate report export functionality will be implemented soon');
  }

  exportAllReports(): void {
    console.log('Exporting all reports...');
    // TODO: Implement export functionality
    alert('Export all reports functionality will be implemented soon');
  }
}
