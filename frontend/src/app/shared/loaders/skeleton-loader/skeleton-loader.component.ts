import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [ngSwitch]="type">
      <!-- Card skeleton -->
      <div *ngSwitchCase="'card'" class="skeleton-card">
        <div class="skeleton thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton line w-70"></div>
          <div class="skeleton line w-40" ></div>
          <div class="skeleton line w-90"></div>
          <div class="skeleton line w-60"></div>
        </div>
      </div>

      <!-- Stats skeleton -->
      <div *ngSwitchCase="'stats'" class="skeleton-stats">
        <div class="skeleton icon-box"></div>
        <div class="skeleton-body">
          <div class="skeleton line w-50"></div>
          <div class="skeleton line w-80"></div>
        </div>
      </div>

      <!-- Row skeleton -->
      <div *ngSwitchDefault class="skeleton-row">
        <ng-container *ngFor="let i of lines">
          <div class="skeleton line" [class.w-70]="i%3===0" [class.w-50]="i%3===1" [class.w-90]="i%3===2"></div>
        </ng-container>
      </div>
    </ng-container>
  `,
  styles: [`
    .skeleton { @include skeleton-base(); }

    .skeleton-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      .thumb { height: 160px; border-radius: 0; margin-bottom: 0; }
    }

    .skeleton-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }

    .skeleton-stats {
      display: flex;
      gap: 12px;
      padding: 16px;
      .icon-box { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
    }

    .line { height: 14px; border-radius: 6px; }

    .w-40 { width: 40%; }
    .w-50 { width: 50%; }
    .w-60 { width: 60%; }
    .w-70 { width: 70%; }
    .w-80 { width: 80%; }
    .w-90 { width: 90%; }

    .skeleton {
      background: linear-gradient(90deg, var(--bg-muted) 25%, var(--border-muted) 50%, var(--bg-muted) 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.6s infinite;
    }

    @keyframes skeleton-loading {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-row { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'stats' | 'row' = 'row';
  @Input() count = 3;

  get lines(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
