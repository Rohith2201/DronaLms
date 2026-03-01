import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CourseModule, EntityId } from '../../core/models';

@Component({
  selector: 'app-module-progress',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatExpansionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-progress">
      <div class="module-header" (click)="toggle()">
        <div class="module-header__left">
          <div class="module-icon" [class.locked]="module.isLocked">
            <mat-icon>{{ module.isLocked ? 'lock' : expanded ? 'folder_open' : 'folder' }}</mat-icon>
          </div>
          <div class="module-info">
            <span class="module-title">{{ module.title }}</span>
            <span class="module-meta">{{ completedCount }}/{{ module.lessons.length }} lessons</span>
          </div>
        </div>
        <div class="module-header__right">
          <span class="module-percent">{{ progressPercent | number:'1.0-0' }}%</span>
          <mat-icon class="expand-icon" [class.rotated]="expanded">expand_more</mat-icon>
        </div>
      </div>

      <!-- Inline progress bar -->
      <div class="module-progress-bar">
        <div class="module-progress-fill" [style.width.%]="progressPercent"></div>
      </div>

      <!-- Lessons list -->
      <div class="lessons-list" [class.expanded]="expanded">
        <div *ngFor="let lesson of module.lessons"
             class="lesson-item"
             [class.active]="activeLessonId === lesson.id"
             [class.completed]="lesson.isCompleted"
             (click)="!module.isLocked && onLessonSelect.emit(lesson.id)">
          <div class="lesson-status">
            <mat-icon *ngIf="lesson.isCompleted" class="completed-icon">check_circle</mat-icon>
            <mat-icon *ngIf="!lesson.isCompleted" class="pending-icon">radio_button_unchecked</mat-icon>
          </div>
          <div class="lesson-info">
            <span class="lesson-title">{{ lesson.title }}</span>
            <span class="lesson-type">
              <mat-icon>{{ getLessonIcon(lesson.type) }}</mat-icon>
              {{ formatDuration(lesson.duration) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-progress {
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-muted);
      margin-bottom: var(--space-2);
      transition: border-color var(--transition-fast);

      &:hover { border-color: var(--border); }
    }

    .module-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
      background: var(--bg-surface);
      user-select: none;

      &:hover { background: var(--bg-hover); }
    }

    .module-header__left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .module-icon {
      width: 36px; height: 36px;
      border-radius: var(--radius-sm);
      background: var(--bg-muted);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }

      &.locked mat-icon { color: var(--text-muted); }
    }

    .module-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .module-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .module-meta {
      font-size: 11px;
      color: var(--text-muted);
    }

    .module-header__right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .module-percent {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
    }

    .expand-icon {
      transition: transform var(--transition-base);
      color: var(--text-muted);
      font-size: 20px;

      &.rotated { transform: rotate(180deg); }
    }

    .module-progress-bar {
      height: 3px;
      background: var(--bg-muted);

      .module-progress-fill {
        height: 100%;
        background: var(--gradient-brand);
        transition: width var(--transition-slow);
      }
    }

    .lessons-list {
      max-height: 0;
      overflow: hidden;
      transition: max-height var(--transition-slow);

      &.expanded { max-height: 600px; }
    }

    .lesson-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4) var(--space-2) var(--space-8);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover { background: var(--bg-hover); }

      &.active {
        background: rgba(92, 107, 192, 0.08);
        border-right: 3px solid var(--primary);
      }

      &.completed .lesson-title { color: var(--text-muted); text-decoration: line-through; }
    }

    .lesson-status {
      .completed-icon { color: var(--success); font-size: 18px; }
      .pending-icon  { color: var(--border);   font-size: 18px; }
    }

    .lesson-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .lesson-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .lesson-type {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-muted);
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
  `]
})
export class ModuleProgressComponent {
  @Input({ required: true }) module!: CourseModule;
  @Input() activeLessonId?: EntityId;
  @Output() onLessonSelect = new EventEmitter<EntityId>();

  expanded = false;

  toggle(): void {
    if (!this.module.isLocked) this.expanded = !this.expanded;
  }

  get completedCount(): number {
    return this.module.lessons.filter(l => l.isCompleted).length;
  }

  get progressPercent(): number {
    if (!this.module.lessons.length) return 0;
    return (this.completedCount / this.module.lessons.length) * 100;
  }

  getLessonIcon(type: string): string {
    const map: Record<string, string> = {
      VIDEO: 'play_circle', TEXT: 'article', QUIZ: 'quiz',
      ASSIGNMENT: 'assignment', PDF: 'picture_as_pdf'
    };
    return map[type] ?? 'school';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}
