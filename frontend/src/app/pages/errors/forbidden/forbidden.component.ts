import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code forbidden">403</div>
        <div class="error-illustration">
          <mat-icon>lock</mat-icon>
        </div>
        <h1>Access Denied</h1>
        <p>You don't have permission to view this page. Please contact an administrator if you think this is a mistake.</p>
        <div class="error-actions">
          <button mat-flat-button color="primary" (click)="goToDashboard()">
            <mat-icon>dashboard</mat-icon> My Dashboard
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
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: var(--space-4);
    }

    .error-illustration mat-icon {
      font-size: 80px;
      color: #f59e0b;
      margin-bottom: var(--space-4);
    }

    h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 var(--space-3); }
    p  { color: var(--text-secondary); margin: 0 0 var(--space-8); font-size: 16px; line-height: 1.6; }

    .error-actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ForbiddenComponent {
  constructor(private location: Location, private auth: AuthService) {}

  goBack(): void { this.location.back(); }

  goToDashboard(): void {
    const role = this.auth.userRole();
    if (role === 'INSTRUCTOR') window.location.href = '/instructor';
    else if (role === 'ADMIN') window.location.href = '/admin';
    else window.location.href = '/student';
  }
}
