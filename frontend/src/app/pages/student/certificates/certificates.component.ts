import {
  Component, OnInit, ChangeDetectionStrategy, signal, inject, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { Certificate, CertificateEligibility, EntityId } from '../../../core/models';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatTooltipModule, MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="certs-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My Certificates</h1>
          <p class="page-subtitle">{{ certificates().length }} earned</p>
        </div>
      </div>

      <!-- Earned Certificates -->
      <section *ngIf="!loading() && certificates().length > 0">
        <h2 class="section-title">
          <mat-icon class="section-icon">workspace_premium</mat-icon>
          Earned Certificates
        </h2>
        <div class="certs-grid">
          <div class="cert-card" *ngFor="let cert of certificates(); trackBy: trackCert">
            <!-- Certificate Visual -->
            <div class="cert-visual">
              <div class="cert-border"></div>
              <div class="cert-inner">
                <mat-icon class="cert-seal">workspace_premium</mat-icon>
                <div class="cert-label">Certificate of Completion</div>
                <div class="cert-student-name" *ngIf="cert.studentName">{{ cert.studentName }}</div>
                <div class="cert-completion-text">has successfully completed</div>
                <div class="cert-course">{{ cert.courseTitle }}</div>
                <div class="cert-date">
                  {{ cert.completionDate ? (cert.completionDate | date:'longDate') : (cert.issuedAt | date:'longDate') }}
                </div>
                <div class="cert-id">Certificate ID: {{ cert.certificateNumber }}</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="cert-actions">
              <button mat-flat-button color="primary" (click)="downloadPdf(cert)">
                <mat-icon>download</mat-icon> Download PDF
              </button>
              <button mat-stroked-button (click)="openVerifyLink(cert)" matTooltip="Open verification page">
                <mat-icon>verified</mat-icon> Verify
              </button>
              <button mat-icon-button (click)="shareOnLinkedIn(cert)" matTooltip="Share on LinkedIn">
                <mat-icon>share</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Eligible Courses (can claim) -->
      <section *ngIf="!loading() && eligible().length > 0" class="eligible-section">
        <h2 class="section-title">
          <mat-icon class="section-icon award">emoji_events</mat-icon>
          Ready to Claim
        </h2>
        <p class="section-desc">You've completed these courses and can claim your certificates now!</p>
        <div class="eligible-grid">
          <div class="eligible-card" *ngFor="let e of eligible()">
            <div class="eligible-icon"><mat-icon>emoji_events</mat-icon></div>
            <div class="eligible-info">
              <h3>{{ e.courseTitle }}</h3>
              <p>{{ e.completionPercentage | number:'1.0-0' }}% Complete • {{ e.completedLessons }}/{{ e.totalLessons }} lessons</p>
            </div>
            <button mat-flat-button color="accent" (click)="claimCertificate(e)">
              <mat-icon>workspace_premium</mat-icon> Claim Certificate
            </button>
          </div>
        </div>
      </section>

      <!-- Almost There -->
      <section *ngIf="!loading() && inProgress().length > 0">
        <h2 class="section-title">
          <mat-icon class="section-icon progress">trending_up</mat-icon>
          Almost There
        </h2>
        <div class="progress-list">
          <div class="progress-item" *ngFor="let item of inProgress()">
            <div class="progress-icon"><mat-icon>school</mat-icon></div>
            <div class="progress-info">
              <h3>{{ item.courseTitle }}</h3>
              <div class="progress-bar-wrapper">
                <div class="progress-fill" [style.width.%]="item.completionPercentage"></div>
              </div>
              <p>{{ item.completionPercentage | number:'1.0-0' }}% complete — {{ item.totalLessons - item.completedLessons }} lessons remaining</p>
            </div>
            <a mat-stroked-button color="primary" [routerLink]="['/learn', item.courseId]">Continue</a>
          </div>
        </div>
      </section>

      <!-- Loading Skeleton -->
      <div class="loading-state" *ngIf="loading()">
        <div class="certs-grid">
          <div class="skeleton-cert" *ngFor="let i of [1,2,3]"></div>
        </div>
      </div>

      <!-- Completely Empty -->
      <div class="empty-state" *ngIf="!loading() && certificates().length === 0 && eligible().length === 0 && inProgress().length === 0">
        <mat-icon>workspace_premium</mat-icon>
        <h3>No certificates yet</h3>
        <p>Complete a course to earn your first certificate!</p>
        <a mat-flat-button color="primary" routerLink="/student/my-courses">
          <mat-icon>school</mat-icon> View My Courses
        </a>
      </div>
    </div>
  `,
  styles: [`
    .certs-page { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }

    .page-header { margin-bottom: var(--space-8); }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-secondary); margin: var(--space-1) 0 0; font-size: 14px; }

    .section-title {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: 1.2rem; margin: var(--space-8) 0 var(--space-4); color: var(--text-primary);
    }
    .section-icon { color: var(--primary); &.award { color: #f59e0b; } &.progress { color: var(--success); } }
    .section-desc { font-size: 14px; color: var(--text-secondary); margin: calc(-1 * var(--space-2)) 0 var(--space-4); }

    /* Cert Grid */
    .certs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-6); }

    .cert-card {
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      overflow: hidden;
      background: var(--bg-surface);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      &:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
    }

    .cert-visual {
      position: relative;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%);
      padding: var(--space-8) var(--space-6);
      text-align: center;
    }

    .cert-border {
      position: absolute;
      inset: 8px;
      border: 2px solid rgba(255,255,255,.25);
      border-radius: var(--radius-lg);
      pointer-events: none;
    }

    .cert-inner { position: relative; z-index: 1; color: white; }

    .cert-seal {
      font-size: 56px !important;
      color: #fbbf24;
      filter: drop-shadow(0 0 20px rgba(251,191,36,.5));
      margin-bottom: var(--space-3);
    }

    .cert-label { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-bottom: var(--space-2); }
    .cert-student-name { font-size: 22px; font-weight: 700; margin-bottom: var(--space-2); line-height: 1.2; color: #fbbf24; }
    .cert-completion-text { font-size: 12px; opacity: 0.7; margin-bottom: var(--space-2); font-style: italic; }
    .cert-course { font-size: 18px; font-weight: 700; margin-bottom: var(--space-3); line-height: 1.3; }
    .cert-date { font-size: 13px; opacity: 0.8; margin-bottom: var(--space-2); }
    .cert-id { font-size: 11px; opacity: 0.5; font-family: 'JetBrains Mono', monospace; }

    .cert-actions {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-4);
      flex-wrap: wrap;
    }

    /* Eligible */
    .eligible-grid { display: flex; flex-direction: column; gap: var(--space-3); }
    .eligible-card {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      background: linear-gradient(135deg, rgba(245,158,11,.1), rgba(234,179,8,.05));
      border: 1px solid rgba(245,158,11,.3);
      border-radius: var(--radius-xl);
    }
    .eligible-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(245,158,11,.2); display: flex; align-items: center; justify-content: center; mat-icon { color: #f59e0b; font-size: 28px; } }
    .eligible-info { flex: 1; h3 { font-size: 15px; font-weight: 600; margin: 0 0 4px; } p { font-size: 13px; color: var(--text-secondary); margin: 0; } }

    /* In Progress */
    .progress-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .progress-item {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
    }
    .progress-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(var(--primary-rgb),.1); display: flex; align-items: center; justify-content: center; mat-icon { color: var(--primary); } }
    .progress-info { flex: 1; h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; } p { font-size: 12px; color: var(--text-secondary); margin: 6px 0 0; } }
    .progress-bar-wrapper { height: 6px; background: var(--bg-base); border-radius: var(--radius-full); overflow: hidden; }
    .progress-fill { height: 100%; background: var(--primary); border-radius: var(--radius-full); }

    /* Skeleton */
    .skeleton-cert { height: 280px; border-radius: var(--radius-xl); background: var(--bg-surface); position: relative; overflow: hidden; &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent); animation: shimmer 1.5s infinite; } }
    @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

    /* Empty */
    .empty-state { text-align: center; padding: var(--space-16); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); mat-icon { font-size: 72px; color: var(--text-tertiary); } h3 { font-size: 1.25rem; } p { color: var(--text-secondary); } }
  `]
})
export class CertificatesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading     = signal(true);
  certificates = signal<Certificate[]>([]);
  eligible    = signal<CertificateEligibility[]>([]);
  inProgress  = signal<CertificateEligibility[]>([]);

  ngOnInit(): void {
    forkJoin({
      certs:   this.api.getMyCertificates(),
      eligible: this.api.getCertificateEligibility()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ certs, eligible }) => {
        this.certificates.set((certs as any)?.content ?? certs ?? []);
        const all = (eligible as any) ?? [];
        this.eligible.set(all.filter((e: CertificateEligibility) => e.eligible && !e.certificateIssued));
        this.inProgress.set(all.filter((e: CertificateEligibility) => !e.eligible && !e.certificateIssued));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  claimCertificate(e: CertificateEligibility): void {
    this.api.generateCertificate(e.enrollmentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (cert: any) => {
        this.certificates.update(list => [...list, cert]);
        this.eligible.update(list => list.filter(x => x.enrollmentId !== e.enrollmentId));
      }
    });
  }

  downloadPdf(cert: Certificate): void {
    this.api.downloadCertificatePdf(cert.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const fileName = `${cert.certificateNumber || 'certificate'}.pdf`;
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(objectUrl);
      }
    });
  }

  openVerifyLink(cert: Certificate): void {
    const verifyUrl = cert.verificationUrl || `/verify-certificate?cert=${encodeURIComponent(cert.certificateNumber || '')}`;
    window.open(verifyUrl, '_blank');
  }

  shareOnLinkedIn(cert: Certificate): void {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.verificationUrl || '')}`;
    window.open(url, '_blank');
  }

  trackCert(_: number, cert: Certificate): EntityId { return cert.id; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
