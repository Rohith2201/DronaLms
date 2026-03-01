import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/realtime/notification.service';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="register-container page-enter">
      <div class="register-card">
        <div class="register-header">
          <h2>Join Drona LMS 🚀</h2>
          <p>Create your free account and start learning today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="register-form">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="name" placeholder="John Doe">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error>Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-icon matPrefix>email</mat-icon>
            <mat-error>Valid email required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="STUDENT">Student</mat-option>
              <mat-option value="INSTRUCTOR">Instructor</mat-option>
            </mat-select>
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password">
            <mat-icon matPrefix>lock</mat-icon>
            <button matSuffix mat-icon-button type="button" (click)="togglePwd()">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Minimum 8 characters</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <input matInput [type]="showConfirm() ? 'text' : 'password'" formControlName="confirmPassword">
            <mat-icon matPrefix>lock_reset</mat-icon>
            <button matSuffix mat-icon-button type="button" (click)="toggleConfirm()">
              <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.hasError('passwordMismatch')">Passwords do not match</mat-error>
          </mat-form-field>

          <button mat-raised-button type="submit" class="btn-gradient register-btn"
                  [disabled]="form.invalid || loading()">
            <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
            <span *ngIf="!loading()">Create Account</span>
          </button>
        </form>

        <div class="register-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container { width: 100%; max-width: 480px; }
    .register-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      box-shadow: var(--shadow-lg);
    }
    .register-header { margin-bottom: var(--space-6); h2 { margin-bottom: var(--space-2); }}
    .register-form { display: flex; flex-direction: column; gap: var(--space-3); mat-form-field { width: 100%; }}
    .register-btn { height: 52px !important; font-size: 16px !important; font-weight: 700 !important; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: var(--space-2); }
    .register-footer { margin-top: var(--space-5); text-align: center; font-size: 14px; }
  `]
})
export class RegisterComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private notif  = inject(NotificationService);

  showPwd     = signal(false);
  showConfirm = signal(false);
  loading     = signal(false);

  togglePwd(): void { this.showPwd.update(v => !v); }
  toggleConfirm(): void { this.showConfirm.update(v => !v); }

  form = this.fb.group({
    name:            ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    role:            ['STUDENT' as UserRole, Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatch });

  private passwordMatch(control: AbstractControl) {
    const pw  = control.get('password')?.value;
    const cpw = control.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { name, email, password, role } = this.form.value;
    this.auth.register({ name: name!, email: email!, password: password!, role: role as UserRole }).subscribe({
      next: () => {
        this.loading.set(false);
        this.notif.success('Account created!', 'Welcome to Drona LMS');
        this.router.navigate(['/student/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        this.notif.error('Registration failed', err.error?.message);
      }
    });
  }
}
