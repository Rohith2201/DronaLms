import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lesson-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.lesson ? 'edit' : 'add' }}</mat-icon>
      {{ data.lesson ? 'Edit Lesson' : 'Create Lesson' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="lesson-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lesson Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Variables and Data Types">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Content Type</mat-label>
          <mat-select formControlName="contentType">
            <mat-option value="VIDEO">Video</mat-option>
            <mat-option value="PDF">PDF Document</mat-option>
            <mat-option value="TEXT">Text Content</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" 
                        *ngIf="form.get('contentType')?.value === 'VIDEO'">
          <mat-label>Video URL</mat-label>
          <input matInput formControlName="videoUrl" placeholder="https://...">
          <mat-hint>YouTube, Vimeo, or direct video link</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" 
                        *ngIf="form.get('contentType')?.value === 'PDF'">
          <mat-label>PDF URL</mat-label>
          <input matInput formControlName="pdfUrl" placeholder="https://...">
          <mat-hint>Direct link to PDF file</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" 
                        *ngIf="form.get('contentType')?.value === 'TEXT'">
          <mat-label>Text Content</mat-label>
          <textarea matInput formControlName="contentText" rows="6" 
                    placeholder="Enter lesson content..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Duration (seconds)</mat-label>
          <input matInput type="number" formControlName="durationSeconds" min="0">
          <mat-hint>Approximate time to complete this lesson</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Order Position (Optional)</mat-label>
          <input matInput type="number" formControlName="position" min="1" placeholder="Auto-assigned">
          <mat-hint>Leave empty to auto-assign next available position</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon>
        {{ data.lesson ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      
      mat-icon {
        color: var(--primary);
      }
    }

    mat-dialog-content {
      min-width: 500px;
      padding: var(--space-6) 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .lesson-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      padding: var(--space-4) 0 0;
      gap: var(--space-2);
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
      }
    }
  `]
})
export class LessonDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<LessonDialogComponent>);

  form = this.fb.group({
    title: [this.data.lesson?.title || '', Validators.required],
    contentType: [this.data.lesson?.contentType || this.data.lesson?.type || 'VIDEO', Validators.required],
    videoUrl: [this.data.lesson?.videoUrl || this.data.lesson?.contentUrl || '', ''],
    pdfUrl: [this.data.lesson?.pdfUrl || (this.data.lesson?.type === 'PDF' ? this.data.lesson?.contentUrl : '') || ''],
    contentText: [this.data.lesson?.contentText || this.data.lesson?.textContent || ''],
    durationSeconds: [this.data.lesson?.durationSeconds || this.data.lesson?.duration || 0],
    position: [this.data.lesson?.position || this.data.lesson?.order || null, Validators.min(1)]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { lesson?: any; moduleId: string }) {}

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
