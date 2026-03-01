import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, ChangeDetectionStrategy,
  ViewChild, ElementRef, OnDestroy, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subject, takeUntil } from 'rxjs';
import { VideoProgress } from '../../core/realtime/progress-tracking.service';
import { Lesson } from '../../core/models';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSliderModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="video-player" [class.fullscreen]="isFullscreen()">
      <video #videoEl
        class="video-el"
        [src]="lesson?.contentUrl"
        [currentTime]="startAt"
        (timeupdate)="onTimeUpdate()"
        (loadedmetadata)="onLoaded()"
        (ended)="onEnded()"
        (play)="playing.set(true)"
        (pause)="playing.set(false)"
        preload="metadata">
      </video>

      <!-- Controls Overlay -->
      <div class="controls-overlay" [class.hidden]="controlsHidden()">

        <!-- Play / Pause Center -->
        <div class="center-control" (click)="togglePlay()">
          <div class="center-btn" [class.visible]="showCenterBtn()">
            <mat-icon>{{ playing() ? 'pause' : 'play_arrow' }}</mat-icon>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="bottom-controls">
          <!-- Progress Seekbar -->
          <div class="seekbar-wrapper">
            <div class="seekbar-track" (click)="seek($event)">
              <div class="seekbar-progress" [style.width.%]="progressPercent()"></div>
              <div class="seekbar-thumb" [style.left.%]="progressPercent()"></div>
            </div>
          </div>

          <div class="controls-row">
            <!-- Play/Pause -->
            <button mat-icon-button (click)="togglePlay()" class="ctrl-btn">
              <mat-icon>{{ playing() ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>

            <!-- Skip back/forward -->
            <button mat-icon-button (click)="skipBack()" class="ctrl-btn" matTooltip="Back 10s">
              <mat-icon>replay_10</mat-icon>
            </button>
            <button mat-icon-button (click)="skipForward()" class="ctrl-btn" matTooltip="Forward 10s">
              <mat-icon>forward_10</mat-icon>
            </button>

            <!-- Volume -->
            <div class="volume-group">
              <button mat-icon-button (click)="toggleMute()" class="ctrl-btn">
                <mat-icon>{{ muted() ? 'volume_off' : 'volume_up' }}</mat-icon>
              </button>
              <input type="range" class="volume-slider" min="0" max="1" step="0.05"
                     [value]="volume()" (input)="setVolume($event)">
            </div>

            <!-- Time display -->
            <span class="time-display">{{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}</span>

            <div class="ctrl-spacer"></div>

            <!-- Playback Speed -->
            <div class="speed-btn-group">
              <button mat-button class="speed-btn"
                      *ngFor="let s of speeds"
                      [class.active]="playbackRate() === s"
                      (click)="setSpeed(s)">
                {{ s }}x
              </button>
            </div>

            <!-- Fullscreen -->
            <button mat-icon-button (click)="toggleFullscreen()" class="ctrl-btn" matTooltip="Fullscreen">
              <mat-icon>{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Completion Banner -->
      <div class="completion-banner" *ngIf="showCompletionBanner()">
        <mat-icon>check_circle</mat-icon>
        <span>Lesson Complete! Great job! 🎉</span>
      </div>
    </div>
  `,
  styles: [`
    .video-player {
      position: relative;
      width: 100%;
      background: #000;
      aspect-ratio: 16/9;
      max-height: calc(100vh - 56px - 80px);
      overflow: hidden;

      &.fullscreen {
        position: fixed !important;
        inset: 0 !important;
        z-index: 9999 !important;
        max-height: none !important;
        aspect-ratio: unset !important;
      }
    }

    .video-el {
      width: 100%; height: 100%;
      object-fit: contain;
      display: block;
      cursor: pointer;
    }

    .controls-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      background: linear-gradient(transparent 40%, rgba(0,0,0,.8) 100%);
      transition: opacity var(--transition-base);

      &.hidden { opacity: 0; pointer-events: none; }
    }

    .center-control {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .center-btn {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: rgba(0,0,0,.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.7);
      transition: all 0.2s ease;
      pointer-events: none;

      &.visible { opacity: 1; transform: scale(1); }

      mat-icon { font-size: 36px; color: white; }
    }

    .bottom-controls { padding: 0 16px 12px; }

    .seekbar-wrapper { margin-bottom: 8px; cursor: pointer; }

    .seekbar-track {
      position: relative;
      height: 4px;
      background: rgba(255,255,255,.3);
      border-radius: 2px;
      cursor: pointer;
      transition: height var(--transition-fast);

      &:hover, .video-player:hover & {
        height: 6px;
      }
    }

    .seekbar-progress {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      background: var(--primary);
      border-radius: 2px;
    }

    .seekbar-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 14px; height: 14px;
      border-radius: 50%;
      background: white;
      display: none;
    }

    .seekbar-track:hover .seekbar-thumb { display: block; }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .ctrl-btn {
      color: rgba(255,255,255,.85) !important;
      mat-icon { font-size: 22px; }
      &:hover { color: white !important; }
    }

    .volume-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .volume-slider {
      width: 72px;
      height: 3px;
      accent-color: var(--primary);
      cursor: pointer;
    }

    .time-display {
      font-size: 13px;
      color: rgba(255,255,255,.85);
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      margin-left: 4px;
    }

    .ctrl-spacer { flex: 1; }

    .speed-btn-group { display: flex; gap: 2px; }
    .speed-btn {
      color: rgba(255,255,255,.7) !important;
      font-size: 12px !important;
      min-width: 36px !important;
      padding: 0 4px !important;
      line-height: 28px !important;
      height: 28px !important;

      &.active { color: var(--primary-light) !important; font-weight: 700 !important; }
    }

    .completion-banner {
      position: absolute;
      top: 16px; left: 50%;
      transform: translateX(-50%);
      background: var(--success);
      color: white;
      padding: 10px 20px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      animation: slideDown 0.4s ease;
      box-shadow: 0 4px 20px rgba(16,185,129,.4);
    }

    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
      to   { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `]
})
export class VideoPlayerComponent implements OnChanges, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @Input() lesson?: Lesson;
  @Input() startAt = 0;
  @Output() videoProgress = new EventEmitter<VideoProgress>();
  @Output() lessonComplete = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private hideControlsTimer?: ReturnType<typeof setTimeout>;

  playing = signal(false);
  muted   = signal(false);
  volume  = signal(1);
  currentTime = signal(0);
  duration    = signal(0);
  isFullscreen = signal(false);
  controlsHidden = signal(false);
  showCenterBtn  = signal(false);
  showCompletionBanner = signal(false);
  playbackRate = signal(1);

  speeds = [0.75, 1, 1.25, 1.5, 2];
  private completionTriggered = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lesson']) {
      this.completionTriggered = false;
      this.showCompletionBanner.set(false);
      // Reset to start of new lesson
      setTimeout(() => {
        const v = this.videoEl?.nativeElement;
        if (v) {
          v.currentTime = this.startAt;
          v.load();
        }
      }, 100);
    }
  }

  onLoaded(): void {
    const v = this.videoEl?.nativeElement;
    if (!v) return;
    this.duration.set(v.duration);
    v.currentTime = this.startAt;
    v.playbackRate = this.playbackRate();
  }

  onTimeUpdate(): void {
    const v = this.videoEl?.nativeElement;
    if (!v || !this.lesson) return;

    this.currentTime.set(v.currentTime);
    const pct = (v.currentTime / v.duration) * 100;

    this.videoProgress.emit({
      lessonId: this.lesson.id,
      enrollmentId: 0, // filled by parent
      watchedSeconds: Math.floor(v.currentTime),
      totalSeconds: Math.floor(v.duration),
      percent: pct
    });

    // Auto-complete at 90%
    if (!this.completionTriggered && pct >= 90) {
      this.completionTriggered = true;
      this.showCompletionBanner.set(true);
      setTimeout(() => this.showCompletionBanner.set(false), 3000);
      this.lessonComplete.emit();
    }
  }

  onEnded(): void {
    if (!this.completionTriggered) {
      this.completionTriggered = true;
      this.lessonComplete.emit();
    }
  }

  togglePlay(): void {
    const v = this.videoEl?.nativeElement;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
    this.flashCenterBtn();
  }

  skipBack(): void    { const v = this.videoEl?.nativeElement; if (v) v.currentTime -= 10; }
  skipForward(): void { const v = this.videoEl?.nativeElement; if (v) v.currentTime += 10; }

  toggleMute(): void {
    const v = this.videoEl?.nativeElement;
    if (!v) return;
    v.muted = !v.muted;
    this.muted.set(v.muted);
  }

  setVolume(event: Event): void {
    const v = this.videoEl?.nativeElement;
    const val = Number((event.target as HTMLInputElement).value);
    if (v) { v.volume = val; this.volume.set(val); }
  }

  setSpeed(rate: number): void {
    const v = this.videoEl?.nativeElement;
    if (v) { v.playbackRate = rate; this.playbackRate.set(rate); }
  }

  seek(event: MouseEvent): void {
    const v = this.videoEl?.nativeElement;
    const track = event.currentTarget as HTMLElement;
    if (!v || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  }

  toggleFullscreen(): void {
    const el = this.videoEl?.nativeElement?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen();
      this.isFullscreen.set(false);
    }
  }

  get progressPercent(): () => number {
    return () => this.duration() > 0 ? (this.currentTime() / this.duration()) * 100 : 0;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private flashCenterBtn(): void {
    this.showCenterBtn.set(true);
    setTimeout(() => this.showCenterBtn.set(false), 600);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.hideControlsTimer);
  }
}
