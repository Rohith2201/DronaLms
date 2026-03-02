import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatStepperModule, MatChipsModule, MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="create-course-page">
      <div class="page-header">
        <a mat-icon-button routerLink="/instructor/courses" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h1>Create New Course</h1>
          <p>Fill in the details below to launch your course.</p>
        </div>
      </div>

      <mat-stepper [linear]="true" #stepper class="course-stepper">

        <!-- Step 1: Basic Info -->
        <mat-step [stepControl]="basicForm" label="Basic Info">
          <form [formGroup]="basicForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Course Title</mat-label>
                <input matInput formControlName="title" placeholder="e.g. Complete Web Development Bootcamp">
                <mat-error *ngIf="basicForm.get('title')?.hasError('required')">Title is required</mat-error>
                <mat-error *ngIf="basicForm.get('title')?.hasError('minlength')">At least 5 characters</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Short Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="What will students learn?"></textarea>
                <mat-hint>{{ basicForm.get('description')?.value?.length ?? 0 }}/500</mat-hint>
                <mat-error *ngIf="basicForm.get('description')?.hasError('required')">Description is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row two-col">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category">
                  <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Difficulty Level</mat-label>
                <mat-select formControlName="level">
                  <mat-option value="BEGINNER">Beginner</mat-option>
                  <mat-option value="INTERMEDIATE">Intermediate</mat-option>
                  <mat-option value="ADVANCED">Advanced</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row two-col">
              <mat-form-field appearance="outline">
                <mat-label>Language</mat-label>
                <mat-select formControlName="language">
                  <mat-option value="English">English</mat-option>
                  <mat-option value="Hindi">Hindi</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Price (USD)</mat-label>
                <input matInput type="number" formControlName="price" placeholder="0.00">
                <span matPrefix>$&nbsp;</span>
                <mat-hint>Set 0 for free course</mat-hint>
              </mat-form-field>
            </div>

            <div class="step-actions">
              <button mat-flat-button color="primary" matStepperNext [disabled]="basicForm.invalid">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Media -->
        <mat-step [stepControl]="mediaForm" label="Media">
          <form [formGroup]="mediaForm" class="step-form">
            <div class="upload-zone" [class.has-thumb]="!!mediaForm.get('thumbnailUrl')?.value">
              <mat-icon>image</mat-icon>
              <h3>Course Thumbnail</h3>
              <p>Recommended 1280×720 (16:9)</p>
              <mat-form-field appearance="outline" class="url-field">
                <mat-label>Thumbnail URL</mat-label>
                <input matInput formControlName="thumbnailUrl" placeholder="https://...">
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row" style="margin-top: var(--space-4)">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preview Video URL (optional)</mat-label>
                <input matInput formControlName="previewVideoUrl" placeholder="https://youtube.com/...">
                <mat-icon matPrefix>play_circle</mat-icon>
              </mat-form-field>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>Back</button>
              <button mat-flat-button color="primary" matStepperNext>
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Review & Publish -->
        <mat-step label="Review">
          <div class="step-form review-step">
            <div class="review-card">
              <h3>Course Summary</h3>
              <div class="review-grid">
                <div class="review-item"><span class="label">Title</span><span class="value">{{ basicForm.get('title')?.value }}</span></div>
                <div class="review-item"><span class="label">Category</span><span class="value">{{ basicForm.get('category')?.value }}</span></div>
                <div class="review-item"><span class="label">Level</span><span class="value">{{ basicForm.get('level')?.value }}</span></div>
                <div class="review-item"><span class="label">Price</span><span class="value">{{ basicForm.get('price')?.value === 0 ? 'Free' : ('$' + basicForm.get('price')?.value) }}</span></div>
              </div>

              <div class="review-desc">
                <span class="label">Description</span>
                <p>{{ basicForm.get('description')?.value }}</p>
              </div>
            </div>

            <div class="publish-options">
              <button mat-flat-button color="primary" (click)="createCourse('DRAFT')" [disabled]="saving()">
                <mat-icon>save</mat-icon> Save as Draft
              </button>
              <button mat-flat-button color="accent" (click)="createCourse('PUBLISHED')" [disabled]="saving()">
                <mat-icon>publish</mat-icon> Publish Now
              </button>
            </div>

            <div *ngIf="saving()" class="saving-indicator">
              <span>Creating course...</span>
            </div>

            <div class="step-actions" style="justify-content: flex-start">
              <button mat-stroked-button matStepperPrevious>Back</button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .create-course-page { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

    .page-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6);
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
      p { color: var(--text-secondary); margin: 4px 0 0; font-size: 14px; }
    }

    .course-stepper { background: transparent; }

    .step-form { padding: var(--space-6) 0; }

    .form-row { margin-bottom: var(--space-4); &.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); } }

    .full-width { width: 100%; }

    .step-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }

    .upload-zone {
      border: 2px dashed var(--border); border-radius: var(--radius-xl);
      padding: var(--space-8); text-align: center; transition: border-color var(--transition-base);
      &:hover { border-color: var(--primary); }
      mat-icon { font-size: 48px; color: var(--text-tertiary); margin-bottom: var(--space-3); }
      h3, p { margin: 0 0 var(--space-2); }
      p { color: var(--text-secondary); font-size: 13px; }
    }
    .url-field { width: 100%; margin-top: var(--space-4); }

    .review-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);
      h3 { margin: 0 0 var(--space-5); font-size: 16px; font-weight: 600; }
    }
    .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-5); }
    .review-item { display: flex; flex-direction: column; gap: 4px; }
    .review-desc { display: flex; flex-direction: column; gap: 4px; p { font-size: 14px; color: var(--text-secondary); margin: 0; } }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-tertiary); letter-spacing: 0.5px; }
    .value { font-size: 15px; font-weight: 500; }

    .publish-options { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }

    .saving-indicator { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
  `]
})
export class CreateCourseComponent implements OnDestroy {
  private fb     = inject(FormBuilder);
  private api    = inject(ApiService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  saving = signal(false);

  categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Business', 'Marketing'];

  basicForm: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(5)]],
    description: ['', Validators.required],
    category:    ['', Validators.required],
    level:       ['BEGINNER', Validators.required],
    language:    ['English', Validators.required],
    price:       [0, [Validators.required, Validators.min(0)]]
  });

  mediaForm: FormGroup = this.fb.group({
    thumbnailUrl:   [''],
    previewVideoUrl: ['']
  });

  createCourse(status: 'DRAFT' | 'PUBLISHED'): void {
    if (this.saving()) return;
    this.saving.set(true);

    const payload = {
      ...this.basicForm.value,
      ...this.mediaForm.value,
      status
    };

    this.api.createCourse(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (course: any) => {
        this.saving.set(false);
        this.router.navigate(['/instructor/courses']);
      },
      error: () => this.saving.set(false)
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
