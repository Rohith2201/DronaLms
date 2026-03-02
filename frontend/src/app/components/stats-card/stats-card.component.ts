import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface StatsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;       // % change
  gradientClass?: string;
  color?: string;
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-card" [class]="data.gradientClass" matRipple>
      <div class="stats-card__header">
        <div class="stats-card__icon" [style.color]="data.color">
          <mat-icon>{{ data.icon }}</mat-icon>
        </div>
        <div *ngIf="data.trend !== undefined" class="stats-card__trend"
             [class.trend-up]="data.trend >= 0"
             [class.trend-down]="data.trend < 0">
          <mat-icon>{{ data.trend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          <span>{{ data.trend | number:'1.1-1' }}%</span>
        </div>
      </div>
      <div class="stats-card__body">
        <div class="stats-card__value">{{ data.value }}</div>
        <div class="stats-card__title">{{ data.title }}</div>
        <div *ngIf="data.subtitle" class="stats-card__subtitle">{{ data.subtitle }}</div>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      cursor: pointer;
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0; right: 0;
        width: 120px; height: 120px;
        background: var(--gradient-card);
        border-radius: 50%;
        transform: translate(30%, -30%);
        pointer-events: none;
      }

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
    }

    .stats-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }

    .stats-card__icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      background: var(--bg-muted);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 22px; width: 22px; height: 22px; color: var(--primary); }
    }

    .stats-card__trend {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: var(--radius-full);

      mat-icon { font-size: 14px; width: 14px; height: 14px; }

      &.trend-up { color: var(--success); background: rgba(16,185,129,.1); }
      &.trend-down { color: var(--danger); background: rgba(239,68,68,.1); }
    }

    .stats-card__value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: var(--space-1);
      letter-spacing: -0.03em;
    }

    .stats-card__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .stats-card__subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: var(--space-1);
    }
  `]
})
export class StatsCardComponent {
  @Input({ required: true }) data!: StatsCardData;
}
