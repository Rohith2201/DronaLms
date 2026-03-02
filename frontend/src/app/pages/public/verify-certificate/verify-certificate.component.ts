import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api-services/api.service';
import { Certificate } from '../../../core/models';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="verify-page">
      <div class="verify-container">
        <!-- Header -->
        <div class="header">
          <mat-icon class="logo-icon">verified</mat-icon>
          <h1>Certificate Verification</h1>
          <p class="subtitle">Verify the authenticity of Drona LMS certificates</p>
        </div>

        <!-- Search Form -->
        <div class="search-form" *ngIf="!certificate() && !error()">
          <mat-form-field appearance="outline" class="cert-input">
            <mat-label>Enter Certificate ID</mat-label>
            <input matInput 
                   [(ngModel)]="certificateNumber" 
                   (keyup.enter)="verify()"
                   placeholder="CERT-1234567890-ABCD1234">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <button mat-flat-button 
                  color="primary" 
                  (click)="verify()" 
                  [disabled]="loading() || !certificateNumber.trim()">
            <mat-icon *ngIf="!loading()">check_circle</mat-icon>
            <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
            <span *ngIf="!loading()">Verify Certificate</span>
            <span *ngIf="loading()">Verifying...</span>
          </button>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading()">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Verifying certificate...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error() && !loading()">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>Certificate Not Found</h2>
          <p>{{ error() }}</p>
          <button mat-flat-button color="primary" (click)="reset()">
            <mat-icon>search</mat-icon> Try Another Certificate
          </button>
        </div>

        <!-- Certificate Display -->
        <div class="certificate-result" *ngIf="certificate() && !loading()">
          <div class="success-badge">
            <mat-icon>verified</mat-icon>
            <span>Verified Certificate</span>
          </div>

          <div class="cert-visual">
            <div class="cert-border"></div>
            <div class="cert-inner">
              <mat-icon class="cert-seal">workspace_premium</mat-icon>
              <div class="cert-label">Certificate of Completion</div>
              <div class="cert-student-name">{{ certificate()!.studentName }}</div>
              <div class="cert-completion-text">has successfully completed</div>
              <div class="cert-course">{{ certificate()!.courseTitle }}</div>
              <div class="cert-date">
                {{ certificate()!.completionDate ? (certificate()!.completionDate | date:'longDate') : (certificate()!.issuedAt | date:'longDate') }}
              </div>
              <div class="cert-id">Certificate ID: {{ certificate()!.certificateNumber }}</div>
            </div>
          </div>

          <div class="cert-details">
            <div class="detail-row">
              <span class="detail-label">Student Name:</span>
              <span class="detail-value">{{ certificate()!.studentName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Course Title:</span>
              <span class="detail-value">{{ certificate()!.courseTitle }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Completion Date:</span>
              <span class="detail-value">{{ certificate()!.completionDate ? (certificate()!.completionDate | date:'medium') : (certificate()!.issuedAt | date:'medium') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Certificate ID:</span>
              <span class="detail-value mono">{{ certificate()!.certificateNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issued:</span>
              <span class="detail-value">{{ certificate()!.issuedAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="actions">
            <a mat-flat-button color="primary" [href]="certificate()!.pdfUrl" target="_blank">
              <mat-icon>download</mat-icon> Download PDF
            </a>
            <button mat-stroked-button (click)="reset()">
              <mat-icon>search</mat-icon> Verify Another
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This certificate was issued by Drona LMS and can be verified anytime.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6);
    }

    .verify-container {
      max-width: 700px;
      width: 100%;
      background: var(--bg-base);
      border-radius: var(--radius-2xl);
      padding: var(--space-10);
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }

    .header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .logo-icon {
      font-size: 64px !important;
      width: 64px;
      height: 64px;
      color: var(--primary);
      margin-bottom: var(--space-3);
      filter: drop-shadow(0 4px 20px rgba(59,130,246,.5));
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 var(--space-2);
      color: var(--text-primary);
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .search-form {
      display: flex;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
    }

    .cert-input {
      flex: 1;
    }

    .loading-state {
      text-align: center;
      padding: var(--space-12);
      
      mat-spinner {
        margin: 0 auto var(--space-4);
      }
      
      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .error-state {
      text-align: center;
      padding: var(--space-8);
      
      .error-icon {
        font-size: 72px !important;
        width: 72px;
        height: 72px;
        color: var(--error);
        margin-bottom: var(--space-3);
      }
      
      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 var(--space-2);
      }
      
      p {
        color: var(--text-secondary);
        margin: 0 0 var(--space-6);
      }
    }

    .certificate-result {
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .success-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: var(--success);
      color: white;
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-full);
      font-weight: 600;
      margin: 0 auto var(--space-6);
      width: fit-content;
      
      mat-icon {
        font-size: 20px;
      }
    }

    .cert-visual {
      position: relative;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%);
      padding: var(--space-8) var(--space-6);
      text-align: center;
      border-radius: var(--radius-xl);
      margin-bottom: var(--space-6);
    }

    .cert-border {
      position: absolute;
      inset: 8px;
      border: 2px solid rgba(255,255,255,.25);
      border-radius: var(--radius-lg);
      pointer-events: none;
    }

    .cert-inner {
      position: relative;
      z-index: 1;
      color: white;
    }

    .cert-seal {
      font-size: 56px !important;
      width: 56px;
      height: 56px;
      color: #fbbf24;
      filter: drop-shadow(0 0 20px rgba(251,191,36,.5));
      margin-bottom: var(--space-3);
    }

    .cert-label {
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: var(--space-2);
    }

    .cert-student-name {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: var(--space-2);
      line-height: 1.2;
      color: #fbbf24;
    }

    .cert-completion-text {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: var(--space-2);
      font-style: italic;
    }

    .cert-course {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: var(--space-3);
      line-height: 1.3;
    }

    .cert-date {
      font-size: 13px;
      opacity: 0.8;
      margin-bottom: var(--space-2);
    }

    .cert-id {
      font-size: 11px;
      opacity: 0.5;
      font-family: 'JetBrains Mono', monospace;
    }

    .cert-details {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border);
      
      &:last-child {
        border-bottom: none;
      }
    }

    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .detail-value {
      color: var(--text-primary);
      text-align: right;
      
      &.mono {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
      }
    }

    .actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
    }

    .footer {
      text-align: center;
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--border);
      
      p {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    mat-spinner ::ng-deep circle {
      stroke: white;
    }
  `]
})
export class VerifyCertificateComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  certificateNumber = '';
  loading = signal(false);
  certificate = signal<Certificate | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Check if certificate number is in query params
    const certParam = this.route.snapshot.queryParamMap.get('cert');
    if (certParam) {
      this.certificateNumber = certParam;
      this.verify();
    }
  }

  verify(): void {
    if (!this.certificateNumber.trim()) return;

    this.loading.set(true);
    this.error.set(null);
    this.certificate.set(null);

    this.api.verifyCertificate(this.certificateNumber.trim()).subscribe({
      next: (cert) => {
        this.certificate.set(cert);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Certificate not found or invalid');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.certificateNumber = '';
    this.certificate.set(null);
    this.error.set(null);
    this.router.navigate([], { queryParams: {} });
  }
}
