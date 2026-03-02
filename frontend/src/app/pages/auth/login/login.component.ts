import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/realtime/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container page-enter">
      <div class="login-card">
        <div class="login-header">
          <h2>Welcome back 👋</h2>
          <p>Sign in to continue your learning journey</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" placeholder="you@example.com">
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'"
                   formControlName="password" autocomplete="current-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button matSuffix mat-icon-button type="button" (click)="togglePassword()">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          </mat-form-field>

          <button mat-raised-button type="submit" class="btn-gradient login-btn"
                  [disabled]="form.invalid || loading()">
            <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
            <span *ngIf="!loading()">Sign in</span>
          </button>
        </form>

        <div class="login-footer">
          <p>Don't have an account? <a routerLink="/auth/register">Create one free</a></p>
        </div>

        <!-- Demo credentials -->
        <div class="demo-credentials">
          <p class="demo-title">Sample credentials</p>
          <div class="demo-items">
            <button class="demo-item" *ngFor="let d of demos" (click)="fillDemo(d)">
              <span class="demo-role">{{ d.role }}</span>
              <span class="demo-email">{{ d.email }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      width: 100%;
      max-width: 440px;
    }

    .login-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-10) var(--space-8);
      box-shadow: var(--shadow-lg);
    }

    .login-header {
      margin-bottom: var(--space-8);

      h2 { font-size: 1.75rem; margin-bottom: var(--space-2); }
      p  { color: var(--text-secondary); }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);

      mat-form-field { width: 100%; }
    }

    .login-btn {
      height: 52px !important;
      font-size: 16px !important;
      font-weight: 700 !important;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: var(--space-2);
    }

    .login-footer {
      margin-top: var(--space-6);
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .demo-credentials {
      margin-top: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-muted);
      border-radius: var(--radius-md);
    }

    .demo-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: var(--space-3);
    }

    .demo-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .demo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-surface);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: left;

      &:hover { border-color: var(--primary); background: var(--bg-hover); }
    }

    .demo-role {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .demo-email {
      font-size: 12px;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private notif  = inject(NotificationService);

  showPassword = signal(false);
  loading      = signal(false);

  togglePassword(): void { this.showPassword.update(v => !v); }

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  demos = [
    { role: 'Student',    email: 'student@drona.io',    password: 'password123' },
    { role: 'Instructor', email: 'instructor@drona.io', password: 'password123' },
    { role: 'Admin',      email: 'admin@drona.io',      password: 'password123' },
  ];

  fillDemo(demo: { email: string; password: string }): void {
    this.form.patchValue(demo);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.auth.login(this.form.value as { email: string; password: string }).subscribe({
      next: () => {
        this.loading.set(false);
        const currentUser = this.auth.getCurrentUser();
        this.notif.success(`Welcome back, ${currentUser?.name ?? 'Learner'}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        const role = currentUser?.role ?? 'STUDENT';
        const defaultRoute = role === 'INSTRUCTOR' ? '/instructor/dashboard'
            : role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
        this.router.navigateByUrl(returnUrl || defaultRoute);
      },
      error: err => {
        this.loading.set(false);
        this.notif.error('Login failed', err.error?.message || 'Invalid credentials');
      }
    });
  }
}
