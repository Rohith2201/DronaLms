import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../../core/api-services/api.service';
import { LmsStateStore } from '../../../core/state-management/lms-state.store';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/realtime/notification.service';
import { Enrollment, StudentDashboard, ActivityItem, EntityId } from '../../../core/models';
import { StatsCardData } from '../../../components/stats-card/stats-card.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private store = inject(LmsStateStore);
  protected auth  = inject(AuthService);
  private notif = inject(NotificationService);
  private cdr   = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  loading = true;
  dashboard?: StudentDashboard;
  continueEnrollment?: Enrollment;

  statsCards: StatsCardData[] = [];

  // ─── Chart Configs ──────────────────────────────────────────
  completionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  completionChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } }
    },
    animation: { animateRotate: true, animateScale: true, duration: 800 }
  };

  activityChartData: ChartData<'line'> = { labels: [], datasets: [] };
  activityChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } }
    },
    plugins: { legend: { display: false } },
    elements: { line: { tension: 0.4, borderWidth: 3 }, point: { radius: 4, hoverRadius: 6 } }
  };

  quizChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  quizChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { max: 100, ticks: { callback: v => v + '%' } }
    },
    plugins: { legend: { display: false } }
  };

  ngOnInit(): void {
    this.loadDashboard();
    // Subscribe to real-time progress updates → refresh charts
    this.store.progressUpdate$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshCharts();
      this.cdr.markForCheck();
    });
  }

  private loadDashboard(): void {
    this.api.getStudentDashboard().subscribe({
      next: dash => {
        this.dashboard = dash;
        this.store.setDashboard(dash);
        this.store.setEnrollments(dash.enrolledCourses);

        this.continueEnrollment = [...dash.enrolledCourses]
          .filter(e => e.progressPercent < 100)
          .sort((a, b) => new Date(b.lastAccessedAt ?? 0).getTime() - new Date(a.lastAccessedAt ?? 0).getTime())[0];

        this.buildStatsCards(dash);
        this.buildCharts(dash);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private buildStatsCards(d: StudentDashboard): void {
    this.statsCards = [
      { title: 'Enrolled Courses', value: d.enrolledCourses.length,   icon: 'school',             trend: 12 },
      { title: 'Completed',        value: d.completedCourses.length,  icon: 'task_alt',           trend: 5  },
      { title: 'Hours Learned',    value: `${d.totalHoursLearned}h`,  icon: 'schedule',           trend: 8  },
      { title: 'Certificates',     value: d.certificates.length,      icon: 'workspace_premium',  trend: 3  },
    ];
  }

  private buildCharts(d: StudentDashboard): void {
    // Completion doughnut
    const inProgress = d.enrolledCourses.filter(e => e.progressPercent > 0 && e.progressPercent < 100).length;
    const completed  = d.completedCourses.length;
    const notStarted = d.enrolledCourses.filter(e => e.progressPercent === 0).length;
    this.completionChartData = {
      labels: ['Completed', 'In Progress', 'Not Started'],
      datasets: [{
        data: [completed, inProgress, notStarted],
        backgroundColor: ['#10b981', '#5c6bc0', '#e2e5ef'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };

    // Weekly activity line chart
    this.activityChartData = {
      labels: d.weeklyProgress.map(w => w.day),
      datasets: [{
        data: d.weeklyProgress.map(w => w.minutes),
        borderColor: '#5c6bc0',
        backgroundColor: 'rgba(92,107,192,.08)',
        fill: true,
      }]
    };
  }

  private refreshCharts(): void {
    const enrollments = this.store.enrollments();
    const completed   = enrollments.filter(e => e.progressPercent === 100).length;
    const inProgress  = enrollments.filter(e => e.progressPercent > 0 && e.progressPercent < 100).length;
    const notStarted  = enrollments.filter(e => e.progressPercent === 0).length;

    this.completionChartData = {
      ...this.completionChartData,
      datasets: [{
        ...this.completionChartData.datasets[0],
        data: [completed, inProgress, notStarted]
      }]
    };
  }

  trackById(_: number, item: Enrollment): EntityId { return item.id; }
  trackByActivity(_: number, item: ActivityItem): EntityId { return item.id; }

  getActivityIcon(type: string): string {
    const m: Record<string, string> = {
      LESSON_COMPLETED: 'check_circle',
      QUIZ_PASSED: 'quiz',
      COURSE_COMPLETED: 'school',
      CERTIFICATE_ISSUED: 'workspace_premium'
    };
    return m[type] ?? 'notifications';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
