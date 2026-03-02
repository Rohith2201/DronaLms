import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">404</div>
        <div class="error-illustration">
          <mat-icon>search_off</mat-icon>
        </div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="error-actions">
          <button mat-flat-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon> Go Home
          </button>
          <button mat-stroked-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-base);
      padding: var(--space-6);
    }

    .error-content {
      text-align: center;
      max-width: 480px;
      animation: fadeIn 0.6s ease;
    }

    .error-code {
      font-size: 9rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: var(--space-4);
    }

    .error-illustration mat-icon {
      font-size: 80px;
      color: var(--text-tertiary);
      margin-bottom: var(--space-4);
    }

    h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 var(--space-3); }
    p  { color: var(--text-secondary); margin: 0 0 var(--space-8); font-size: 16px; }

    .error-actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NotFoundComponent {
  constructor(private location: Location) {}
  goBack(): void { this.location.back(); }
}
