import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../../core/api-services/api.service';
import { AdminAnalytics } from '../../../core/models';
import { RealtimeService } from '../../../core/realtime/realtime.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-dash">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="page-subtitle">Platform-wide overview</p>
        </div>
        <div class="header-btns">
          <a mat-stroked-button routerLink="/admin/users"><mat-icon>people</mat-icon> Manage Users</a>
          <a mat-flat-button color="primary" routerLink="/admin/analytics"><mat-icon>analytics</mat-icon> Full Analytics</a>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="kpi-grid" *ngIf="loading()">
        <div class="skeleton-kpi" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" *ngIf="!loading() && analytics()">
        <div class="kpi-card" style="--kpi-color: #3b82f6">
          <mat-icon class="kpi-icon">people</mat-icon>
          <div class="kpi-val">{{ analytics()?.totalUsers | number }}</div>
          <div class="kpi-lbl">Total Users</div>
          <div class="kpi-trend up"><mat-icon>trending_up</mat-icon> {{ analytics()?.newUsersThisMonth | number }} this month</div>
        </div>
        <div class="kpi-card" style="--kpi-color: #8b5cf6">
          <mat-icon class="kpi-icon">menu_book</mat-icon>
          <div class="kpi-val">{{ analytics()?.totalCourses | number }}</div>
          <div class="kpi-lbl">Total Courses</div>
        </div>
        <div class="kpi-card" style="--kpi-color: #10b981">
          <mat-icon class="kpi-icon">school</mat-icon>
          <div class="kpi-val">{{ analytics()?.totalEnrollments | number }}</div>
          <div class="kpi-lbl">Enrollments</div>
        </div>
        <div class="kpi-card" style="--kpi-color: #f59e0b">
          <mat-icon class="kpi-icon">workspace_premium</mat-icon>
          <div class="kpi-val">{{ analytics()?.totalCertificates | number }}</div>
          <div class="kpi-lbl">Certificates Issued</div>
        </div>
        <div class="kpi-card" style="--kpi-color: #ef4444">
          <mat-icon class="kpi-icon">person</mat-icon>
          <div class="kpi-val">{{ analytics()?.activeUsers | number }}</div>
          <div class="kpi-lbl">Active Users (30d)</div>
        </div>
        <div class="kpi-card" style="--kpi-color: #06b6d4">
          <mat-icon class="kpi-icon">trending_up</mat-icon>
          <div class="kpi-val">{{ analytics()?.avgCompletionRate | number:'1.0-0' }}%</div>
          <div class="kpi-lbl">Avg. Completion Rate</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-row" *ngIf="!loading() && analytics()">
        <!-- User Growth -->
        <div class="chart-card flex-2">
          <div class="chart-header">
            <h3>User Growth</h3>
            <p>New user registrations over last 6 months</p>
          </div>
          <div class="chart-area">
            <canvas baseChart [data]="userGrowthData" [options]="lineOptions" type="bar"></canvas>
          </div>
        </div>

        <!-- Role Distribution -->
        <div class="chart-card flex-1">
          <div class="chart-header"><h3>User Roles</h3></div>
          <div class="chart-area donut">
            <canvas baseChart [data]="roleChartData" [options]="doughnutOptions" type="doughnut"></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-links" *ngIf="!loading()">
        <h3 class="section-title"><mat-icon>flash_on</mat-icon> Quick Actions</h3>
        <div class="links-grid">
          <a class="link-card" routerLink="/admin/users">
            <mat-icon>manage_accounts</mat-icon>
            <span>Manage Users</span>
          </a>
          <a class="link-card" routerLink="/admin/courses">
            <mat-icon>library_books</mat-icon>
            <span>All Courses</span>
          </a>
          <a class="link-card" routerLink="/admin/analytics">
            <mat-icon>analytics</mat-icon>
            <span>Full Analytics</span>
          </a>
          <a class="link-card" routerLink="/admin/settings">
            <mat-icon>settings</mat-icon>
            <span>Platform Settings</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dash { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-secondary); margin: 4px 0 0; font-size: 14px; }
    .header-btns { display: flex; gap: var(--space-3); flex-wrap: wrap; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-8); }

    .kpi-card {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-5);
      border-top: 4px solid var(--kpi-color);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    }
    .kpi-icon { font-size: 28px; color: var(--kpi-color); margin-bottom: var(--space-3); }
    .kpi-val { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-lbl { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
    .kpi-trend { font-size: 11px; margin-top: var(--space-2); display: flex; align-items: center; gap: 2px; &.up { color: var(--success); } mat-icon { font-size: 14px; } }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6); margin-bottom: var(--space-8); }
    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }

    .chart-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-6); }
    .chart-header { margin-bottom: var(--space-4); h3 { margin: 0; font-size: 16px; font-weight: 600; } p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); } }
    .chart-area { height: 240px; position: relative; }
    .chart-area.donut { display: flex; align-items: center; justify-content: center; }

    .section-title { display: flex; align-items: center; gap: var(--space-2); font-size: 1.1rem; margin: 0 0 var(--space-4); mat-icon { color: var(--primary); } }

    .links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-4); }
    .link-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3);
      padding: var(--space-6); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
      text-decoration: none; color: var(--text-primary); transition: all var(--transition-base);
      font-weight: 500; font-size: 14px;
      mat-icon { font-size: 32px; color: var(--primary); }
      &:hover { background: var(--primary); color: white; transform: translateY(-4px); box-shadow: var(--shadow-xl); mat-icon { color: white; } }
    }

    .skeleton-kpi { height: 120px; border-radius: var(--radius-xl); background: var(--bg-surface); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading   = signal(true);
  analytics = signal<AdminAnalytics | null>(null);

  userGrowthData: ChartData<'bar'> = { labels: [], datasets: [] };
  roleChartData:  ChartData<'doughnut'> = { labels: [], datasets: [] };

  lineOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,.1)' } }
    }
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } } },
    cutout: '60%'
  };

  ngOnInit(): void {
    this.api.getAdminAnalytics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        this.analytics.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildCharts(data: AdminAnalytics): void {
    const months = data.userGrowthTrend?.map((t: any) => t.month) ?? [];
    const counts  = data.userGrowthTrend?.map((t: any) => t.count) ?? [];
    this.userGrowthData = {
      labels: months,
      datasets: [{
        label: 'New Users',
        data: counts,
        backgroundColor: '#6366f1',
        borderRadius: 6
      }]
    };

    this.roleChartData = {
      labels: ['Students', 'Instructors', 'Admins'],
      datasets: [{ data: [data.studentCount ?? 0, data.instructorCount ?? 0, data.adminCount ?? 0], backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'], borderWidth: 0 }]
    };
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
