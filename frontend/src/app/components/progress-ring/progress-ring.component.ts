import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-ring" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle class="ring-track"
          cx="50" cy="50"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
        />
        <!-- Progress circle -->
        <circle class="ring-progress"
          cx="50" cy="50"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          [attr.stroke]="color"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div class="ring-label">
        <span class="ring-value">{{ value | number:'1.0-0' }}<span class="ring-unit">%</span></span>
        <span *ngIf="label" class="ring-text">{{ label }}</span>
      </div>
    </div>
  `,
  styles: [`
    .progress-ring {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg { position: absolute; }

    .ring-track {
      stroke: var(--bg-muted);
      transition: stroke var(--transition-base);
    }

    .ring-progress {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 0 4px var(--shadow-glow));
    }

    .ring-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .ring-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
      letter-spacing: -0.04em;

      .ring-unit {
        font-size: 0.75em;
        font-weight: 600;
      }
    }

    .ring-text {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
      text-align: center;
      margin-top: 2px;
    }
  `]
})
export class ProgressRingComponent {
  @Input() value = 0;         // 0-100
  @Input() size = 100;
  @Input() strokeWidth = 8;
  @Input() color = 'url(#progressGradient)';
  @Input() label?: string;

  get radius(): number { return 50 - this.strokeWidth / 2 - 2; }
  get circumference(): number { return 2 * Math.PI * this.radius; }
  get dashOffset(): number {
    const capped = Math.min(Math.max(this.value, 0), 100);
    return this.circumference - (capped / 100) * this.circumference;
  }
}
