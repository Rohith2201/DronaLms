import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { Course, Enrollment } from '../../core/models';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatChipsModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="course-card card card-hover" matRipple>
      <!-- Thumbnail -->
      <div class="course-card__thumb">
        <img [src]="course.thumbnailUrl || 'assets/images/course-placeholder.jpg'"
             [alt]="course.title" loading="lazy">
        <div *ngIf="enrollment" class="course-card__progress-overlay">
          <div class="progress-bar-wrapper">
            <div class="progress-fill" [style.width.%]="enrollment.progressPercent"></div>
          </div>
          <span class="progress-text">{{ enrollment.progressPercent | number:'1.0-0' }}% complete</span>
        </div>
        <div class="course-card__badge">
          <span class="badge"
                [class.badge-success]="course.level === 'BEGINNER'"
                [class.badge-warning]="course.level === 'INTERMEDIATE'"
                [class.badge-danger]="course.level === 'ADVANCED'">
            {{ course.level | titlecase }}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="course-card__body">
        <div class="course-card__category">{{ course.category }}</div>
        <h3 class="course-card__title">{{ course.title }}</h3>
        <p class="course-card__desc">{{ course.description }}</p>

        <div class="course-card__meta">
          <div class="meta-item">
            <mat-icon>star</mat-icon>
            <span>{{ course.rating | number:'1.1-1' }}</span>
          </div>
          <div class="meta-item">
            <mat-icon>people</mat-icon>
            <span>{{ formatCount(course.enrollmentCount ?? 0) }}</span>
          </div>
          <div class="meta-item">
            <mat-icon>schedule</mat-icon>
            <span>{{ formatDuration(course.totalDuration ?? 0) }}</span>
          </div>
        </div>

        <div class="course-card__footer">
          <div class="instructor">
            <mat-icon>person</mat-icon>
            <span>{{ course.instructor?.name }}</span>
          </div>
          <div class="price-action">
            <span *ngIf="!enrollment && (course.price ?? 0) > 0" class="price">
              \${{ course.price | number:'1.2-2' }}
            </span>
            <button *ngIf="enrollment" mat-flat-button color="primary"
                    [routerLink]="['/learn', course.id]" class="btn-sm">
              Continue
            </button>
            <button *ngIf="!enrollment" mat-flat-button color="primary"
                    (click)="onEnroll.emit(course)" class="btn-sm">
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .course-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      cursor: pointer;

      &:hover .course-card__thumb img {
        transform: scale(1.04);
      }
    }

    .course-card__thumb {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      aspect-ratio: 16/9;

      img {
        width: 100%; height: 100%;
        object-fit: cover;
        transition: transform var(--transition-slow);
      }
    }

    .course-card__progress-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: var(--space-2);
      background: linear-gradient(transparent, rgba(0,0,0,.7));

      .progress-bar-wrapper { margin-bottom: 4px; }
      .progress-text { font-size: 11px; color: white; font-weight: 500; }
    }

    .course-card__badge {
      position: absolute;
      top: var(--space-2);
      left: var(--space-2);
    }

    .course-card__body {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: var(--space-2);
    }

    .course-card__category {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
    }

    .course-card__title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-card__desc {
      font-size: 13px;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .course-card__meta {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-secondary);

        mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--warning); }
      }
    }

    .course-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: var(--space-2);
      border-top: 1px solid var(--border-muted);

      .instructor {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-muted);
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
      }

      .price {
        font-size: 16px;
        font-weight: 800;
        color: var(--text-primary);
      }
    }

    .btn-sm {
      height: 32px !important;
      font-size: 12px !important;
      padding: 0 12px !important;
    }
  `]
})
export class CourseCardComponent {
  @Input({ required: true }) course!: Course;
  @Input() enrollment?: Enrollment;
  @Output() onEnroll = new EventEmitter<Course>();

  formatCount(count: number): string {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return String(count);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
