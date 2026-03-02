import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <!-- Left: Branding Panel -->
      <div class="auth-panel-left">
        <div class="auth-brand">
          <div class="brand-logo">
            <mat-icon>auto_stories</mat-icon>
          </div>
          <h1 class="brand-name">Drona LMS</h1>
          <p class="brand-tagline">AI-powered learning for the next generation</p>
        </div>
        <div class="auth-features">
          <div class="feature" *ngFor="let f of features">
            <div class="feature-icon"><mat-icon>{{ f.icon }}</mat-icon></div>
            <div>
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>
        <div class="auth-stats">
          <div class="stat" *ngFor="let s of stats">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <div class="auth-panel-right">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .auth-layout {
      display: flex;
      height: 100vh;
    }

    /* Left panel */
    .auth-panel-left {
      flex: 0 0 50%;
      background: var(--gradient-hero);
      padding: var(--space-12) var(--space-10);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--space-10);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%; right: -30%;
        width: 600px; height: 600px;
        background: radial-gradient(circle, rgba(92,107,192,.3) 0%, transparent 70%);
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -30%; left: -20%;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(168,85,247,.25) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    .auth-brand {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .brand-logo {
      width: 60px; height: 60px;
      border-radius: var(--radius-lg);
      background: rgba(255,255,255,.15);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);

      mat-icon { font-size: 32px; color: white; }
    }

    .brand-name {
      font-size: 2.5rem;
      font-weight: 900;
      color: white;
      letter-spacing: -0.04em;
    }

    .brand-tagline {
      font-size: 16px;
      color: rgba(255,255,255,.7);
      max-width: 300px;
      line-height: 1.5;
    }

    .auth-features {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .feature {
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .feature-icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-md);
      background: rgba(255,255,255,.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { color: white; font-size: 20px; }
    }

    .feature-title {
      font-size: 15px;
      font-weight: 600;
      color: white;
    }

    .feature-desc {
      font-size: 13px;
      color: rgba(255,255,255,.6);
      line-height: 1.4;
      margin-top: 2px;
    }

    .auth-stats {
      display: flex;
      gap: var(--space-8);
      padding-top: var(--space-4);
      border-top: 1px solid rgba(255,255,255,.15);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(255,255,255,.6);
    }

    /* Right panel */
    .auth-panel-right {
      flex: 1;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      overflow-y: auto;
    }

    @media (max-width: 900px) {
      .auth-panel-left { display: none; }
    }
  `]
})
export class AuthLayoutComponent {
  features = [
    { icon: 'smart_toy',    title: 'AI Learning Assistant', desc: 'Get personalized help with an intelligent AI tutor' },
    { icon: 'trending_up',  title: 'Real-time Progress',    desc: 'Track your learning journey with live analytics' },
    { icon: 'workspace_premium', title: 'Earn Certificates', desc: 'Validate your skills with verified certificates' },
  ];

  stats = [
    { value: '10K+', label: 'Students' },
    { value: '500+', label: 'Courses' },
    { value: '98%',  label: 'Satisfaction' },
  ];
}
