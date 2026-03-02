import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-module-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.module ? 'edit' : 'add' }}</mat-icon>
      {{ data.module ? 'Edit Module' : 'Create Module' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="module-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Module Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Introduction to Programming">
          <mat-error *ngIf="form.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4" 
                    placeholder="Brief description of what students will learn in this module"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Order Position</mat-label>
          <input matInput type="number" formControlName="order" min="1">
          <mat-hint>Determines the order in which modules appear</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon>
        {{ data.module ? 'Update' : 'Create' }}
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

    .module-form {
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
export class ModuleDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ModuleDialogComponent>);

  form = this.fb.group({
    title: [this.data.module?.title || '', Validators.required],
    description: [this.data.module?.description || ''],
    order: [this.data.module?.order || 1, [Validators.required, Validators.min(1)]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { module?: any; courseId: string }) {}

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
