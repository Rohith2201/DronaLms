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
  selector: 'app-quiz-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.quiz ? 'edit' : 'add' }}</mat-icon>
      {{ data.quiz ? 'Edit Quiz' : 'Create Quiz' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="quiz-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quiz Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Chapter 1 Assessment">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" 
                    placeholder="Brief description of the quiz"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Max Score</mat-label>
            <input matInput type="number" formControlName="maxScore" min="1">
            <mat-error *ngIf="form.get('maxScore')?.hasError('required')">Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Passing Score</mat-label>
            <input matInput type="number" formControlName="passingScore" min="0">
            <mat-error *ngIf="form.get('passingScore')?.hasError('required')">Required</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Time Limit (minutes)</mat-label>
          <input matInput type="number" formControlName="timeLimitMinutes" min="0">
          <mat-hint>Leave 0 for no time limit</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Module</mat-label>
          <mat-select formControlName="moduleId">
            <mat-option *ngFor="let module of data.modules" [value]="module.id">
              {{ module.title }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('moduleId')?.hasError('required')">Module is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon>
        {{ data.quiz ? 'Update' : 'Create' }}
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
    }

    .quiz-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .full-width {
      width: 100%;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    }

    .half-width {
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

      .row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuizDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuizDialogComponent>);

  form = this.fb.group({
    title: [this.data.quiz?.title || '', Validators.required],
    description: [this.data.quiz?.description || ''],
    maxScore: [this.data.quiz?.maxScore || 100, [Validators.required, Validators.min(1)]],
    passingScore: [this.data.quiz?.passingScore || 60, [Validators.required, Validators.min(0)]],
    timeLimitMinutes: [this.data.quiz?.timeLimitMinutes || 0],
    moduleId: [this.data.quiz?.moduleId || this.data.modules?.[0]?.id || '', Validators.required]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { quiz?: any; modules: any[] }) {}

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
