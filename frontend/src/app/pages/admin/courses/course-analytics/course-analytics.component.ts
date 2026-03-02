import { Component, OnInit, OnDestroy, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AdminCoursesService } from '../../services/admin-courses.service';
import { ExportService } from '../../services/export.service';
import { CourseAnalytics } from '../../models/admin.models';

Chart.register(...registerables);

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './course-analytics.component.html',
  styleUrls: ['./course-analytics.component.scss']
})
export class CourseAnalyticsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesService = inject(AdminCoursesService);
  private exportService = inject(ExportService);
  private destroy$ = new Subject<void>();

  courseId = signal<string>('');
  analytics = signal<CourseAnalytics | null>(null);
  loading = signal(false);

  // Charts
  private progressChart?: Chart;
  private performanceChart?: Chart;
  private scoresChart?: Chart;
  private enrollmentChart?: Chart;

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.paramMap.get('courseId') || '');
    
    if (this.courseId()) {
      this.loadAnalytics();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    
    this.coursesService.getCourseAnalytics(this.courseId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.loading.set(false);
          
          // Wait for DOM to render, then create charts
          setTimeout(() => {
            this.createCharts();
          }, 100);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  createCharts(): void {
    const analytics = this.analytics();
    if (!analytics) return;

    this.createProgressChart(analytics);
    this.createPerformanceChart(analytics);
    this.createScoresChart(analytics);
    this.createEnrollmentChart(analytics);
  }

  createProgressChart(analytics: CourseAnalytics): void {
    const canvas = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Not Started'],
        datasets: [{
          data: [
            analytics.progressDistribution.completed,
            analytics.progressDistribution.inProgress,
            analytics.progressDistribution.notStarted
          ],
          backgroundColor: ['#4caf50', '#ffa726', '#e0e0e0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });
  }

  createPerformanceChart(analytics: CourseAnalytics): void {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = analytics.performanceTrends.map(t => {
      const date = new Date(t.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Average Progress',
            data: analytics.performanceTrends.map(t => t.averageProgress),
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Active Users',
            data: analytics.performanceTrends.map(t => t.activeUsers),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  createScoresChart(analytics: CourseAnalytics): void {
    const canvas = document.getElementById('scoresChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.scoresChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Excellent (90-100)', 'Good (75-89)', 'Average (60-74)', 'Poor (0-59)'],
        datasets: [{
          label: 'Students',
          data: [
            analytics.scoreDistribution.excellent,
            analytics.scoreDistribution.good,
            analytics.scoreDistribution.average,
            analytics.scoreDistribution.poor
          ],
          backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  createEnrollmentChart(analytics: CourseAnalytics): void {
    const canvas = document.getElementById('enrollmentChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = analytics.enrollmentTrend.map(t => {
      const date = new Date(t.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    this.enrollmentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Enrollments',
          data: analytics.enrollmentTrend.map(t => t.count),
          backgroundColor: '#3f51b5',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  destroyCharts(): void {
    if (this.progressChart) this.progressChart.destroy();
    if (this.performanceChart) this.performanceChart.destroy();
    if (this.scoresChart) this.scoresChart.destroy();
    if (this.enrollmentChart) this.enrollmentChart.destroy();
  }

  exportAnalytics(format: 'CSV' | 'EXCEL'): void {
    const analytics = this.analytics();
    if (analytics) {
      this.exportService.exportCourseAnalytics(analytics, format);
    }
  }

  viewEnrolledUsers(): void {
    this.router.navigate(['/admin/courses', this.courseId(), 'enrolled-users']);
  }

  goBack(): void {
    this.router.navigate(['/admin/courses']);
  }
}
