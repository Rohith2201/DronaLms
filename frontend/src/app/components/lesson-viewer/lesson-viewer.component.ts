import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { VideoProgress } from '../../core/realtime/progress-tracking.service';
import { Lesson } from '../../core/models';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, VideoPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lesson-viewer">
      <!-- VIDEO -->
      <app-video-player
        *ngIf="lesson?.type === 'VIDEO'"
        [lesson]="lesson"
        [startAt]="startAt"
        (videoProgress)="videoProgress.emit($event)"
        (lessonComplete)="lessonComplete.emit()">
      </app-video-player>

      <!-- TEXT / ARTICLE -->
      <div *ngIf="lesson?.type === 'TEXT'" class="text-lesson scroll-y">
        <div class="text-lesson-content" [innerHTML]="lesson?.textContent"></div>
        <div class="text-lesson-actions">
          <button mat-flat-button color="primary" (click)="lessonComplete.emit()">
            <mat-icon>check_circle</mat-icon> Mark as Complete
          </button>
        </div>
      </div>

      <!-- PDF -->
      <div *ngIf="lesson?.type === 'PDF'" class="pdf-lesson">
        <iframe [src]="lesson?.contentUrl" class="pdf-frame"></iframe>
        <div class="pdf-actions">
          <button mat-flat-button color="primary" (click)="lessonComplete.emit()">
            <mat-icon>check_circle</mat-icon> Mark as Complete
          </button>
        </div>
      </div>

      <!-- QUIZ -->
      <div *ngIf="lesson?.type === 'QUIZ'" class="quiz-lesson">
        <div class="quiz-placeholder">
          <mat-icon>quiz</mat-icon>
          <h3>Quiz: {{ lesson?.title }}</h3>
          <p>Complete the quiz to proceed to the next lesson.</p>
          <button mat-flat-button color="primary">Start Quiz</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lesson-viewer { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #000; }

    .text-lesson {
      flex: 1;
      background: var(--bg-base);
      padding: var(--space-8) var(--space-12);
      overflow-y: auto;
    }

    .text-lesson-content {
      max-width: 800px;
      margin: 0 auto;
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-primary);
    }

    .text-lesson-actions {
      max-width: 800px;
      margin: var(--space-8) auto 0;
      padding-top: var(--space-6);
      border-top: 1px solid var(--border);
    }

    .pdf-lesson {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .pdf-frame {
      flex: 1;
      border: none;
      width: 100%;
    }

    .pdf-actions {
      padding: var(--space-4);
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
    }

    .quiz-lesson {
      flex: 1;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quiz-placeholder {
      text-align: center;
      padding: var(--space-10);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);

      mat-icon { font-size: 72px; color: var(--primary); opacity: 0.6; }
      h3 { font-size: 1.5rem; }
      p { color: var(--text-secondary); }
    }
  `]
})
export class LessonViewerComponent {
  @Input() lesson?: Lesson;
  @Input() startAt = 0;
  @Output() videoProgress = new EventEmitter<VideoProgress>();
  @Output() lessonComplete = new EventEmitter<void>();
}
