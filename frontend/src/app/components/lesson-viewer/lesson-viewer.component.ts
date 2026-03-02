import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
      <!-- VIDEO - Embedded (YouTube, Vimeo, etc.) -->
      <div *ngIf="lesson?.type === 'VIDEO' && isEmbedVideo" class="video-embed">
        <iframe [src]="videoEmbedUrl" 
                class="video-iframe"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
        <div class="video-actions">
          <button mat-flat-button color="primary" (click)="onMarkComplete()">
            <mat-icon>check_circle</mat-icon> Mark as Complete
          </button>
        </div>
      </div>

      <!-- VIDEO - Direct File (mp4, webm, etc.) -->
      <app-video-player
        *ngIf="lesson?.type === 'VIDEO' && !isEmbedVideo"
        [lesson]="lesson"
        [startAt]="startAt"
        (videoProgress)="videoProgress.emit($event)"
        (lessonComplete)="lessonComplete.emit()">
      </app-video-player>

      <!-- TEXT / ARTICLE -->
      <div *ngIf="lesson?.type === 'TEXT'" class="text-lesson scroll-y">
        <div class="text-lesson-content" [innerHTML]="lesson?.contentText || lesson?.textContent"></div>
        <div class="text-lesson-actions">
          <button mat-flat-button color="primary" (click)="onMarkComplete()">
            <mat-icon>check_circle</mat-icon> Mark as Complete
          </button>
        </div>
      </div>

      <!-- PDF -->
      <div *ngIf="lesson?.type === 'PDF'" class="pdf-lesson">
        <iframe *ngIf="pdfUrl" [src]="pdfUrl" class="pdf-frame"></iframe>
        <div class="pdf-actions">
          <button mat-flat-button color="primary" (click)="onMarkComplete()">
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

    .video-embed {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #000;
    }

    .video-iframe {
      flex: 1;
      width: 100%;
      border: none;
      aspect-ratio: 16/9;
      max-height: calc(100vh - 56px - 80px);
    }

    .video-actions {
      padding: var(--space-4);
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
    }

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

  constructor(private sanitizer: DomSanitizer) {}

  get isEmbedVideo(): boolean {
    const url = this.lesson?.contentUrl || '';
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') ||
           url.includes('embed');
  }

  get videoEmbedUrl(): SafeResourceUrl | null {
    const url = this.lesson?.contentUrl || '';
    if (!url) return null;

    let embedUrl = url;

    // Convert YouTube watch URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } 
    // Convert short YouTube URLs to embed format
    else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    else if (url.includes('vimeo.com') && !url.includes('/video/')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  get pdfUrl(): SafeResourceUrl | null {
    const url = this.lesson?.contentUrl || (this.lesson as any)?.pdfUrl;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }

  onMarkComplete(): void {
    this.lessonComplete.emit();
  }
}
