import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-question-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatRadioModule, MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.question ? 'edit' : 'add' }}</mat-icon>
      {{ data.question ? 'Edit Question' : 'Add Question' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="question-form">
        <!-- Question Text -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Question Text</mat-label>
          <textarea matInput formControlName="questionText" rows="3" 
                    placeholder="Enter your question..."></textarea>
          <mat-error *ngIf="form.get('questionText')?.hasError('required')">
            Question text is required
          </mat-error>
        </mat-form-field>

        <!-- Question Type -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Question Type</mat-label>
          <mat-select formControlName="questionType">
            <mat-option value="MULTIPLE_CHOICE">Multiple Choice</mat-option>
            <mat-option value="TRUE_FALSE">True/False</mat-option>
            <mat-option value="SHORT_ANSWER">Short Answer</mat-option>
            <mat-option value="ESSAY">Essay</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Options (for MULTIPLE_CHOICE and TRUE_FALSE) -->
        <div *ngIf="showOptions()" class="options-section">
          <div class="section-header">
            <h4>Answer Options</h4>
            <button *ngIf="questionType() === 'MULTIPLE_CHOICE'" 
                    mat-button type="button" (click)="addOption()">
              <mat-icon>add</mat-icon> Add Option
            </button>
          </div>

          <div formArrayName="options" class="options-list">
            <div *ngFor="let opt of options.controls; let i = index" 
                 [formGroupName]="i" class="option-row">
              <div class="option-number">{{ getOptionLetter(i) }}</div>
              
              <mat-form-field appearance="outline" class="option-input">
                <mat-label>Option {{ i + 1 }}</mat-label>
                <input matInput formControlName="optionText" 
                       [placeholder]="'Option ' + (i + 1)">
              </mat-form-field>

              <mat-radio-button [value]="i" 
                                [checked]="opt.get('isCorrect')?.value"
                                (change)="setCorrectAnswer(i)"
                                color="primary">
                Correct
              </mat-radio-button>

              <button *ngIf="questionType() === 'MULTIPLE_CHOICE' && options.length > 2" 
                      mat-icon-button type="button" (click)="removeOption(i)"
                      color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Correct Answer (for SHORT_ANSWER) -->
        <mat-form-field *ngIf="questionType() === 'SHORT_ANSWER'" 
                        appearance="outline" class="full-width">
          <mat-label>Correct Answer</mat-label>
          <input matInput formControlName="correctAnswer" 
                 placeholder="Enter the correct answer">
        </mat-form-field>

        <div class="row">
          <!-- Points -->
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Points</mat-label>
            <input matInput type="number" formControlName="points" min="1">
            <mat-error *ngIf="form.get('points')?.hasError('required')">Required</mat-error>
          </mat-form-field>

          <!-- Difficulty -->
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Difficulty</mat-label>
            <mat-select formControlName="difficulty">
              <mat-option value="EASY">Easy</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="HARD">Hard</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Explanation (Optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Explanation (Optional)</mat-label>
          <textarea matInput formControlName="explanation" rows="2" 
                    placeholder="Explain why this is the correct answer..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon>
        {{ data.question ? 'Update' : 'Add' }}
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
      min-width: 700px;
      padding: var(--space-6) 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .question-form {
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

    .options-section {
      padding: var(--space-4);
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);

        h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
      }
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);

      .option-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .option-input {
        flex: 1;
        margin-bottom: 0 !important;
      }

      mat-radio-button {
        flex-shrink: 0;
      }
    }

    mat-dialog-actions {
      padding: var(--space-4) 0 0;
      gap: var(--space-2);
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: 400px;
      }

      .row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuestionDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuestionDialogComponent>);

  questionType = signal(this.data.question?.questionType || 'MULTIPLE_CHOICE');

  form = this.fb.group({
    questionText: [this.data.question?.questionText || '', Validators.required],
    questionType: [this.data.question?.questionType || 'MULTIPLE_CHOICE', Validators.required],
    points: [this.data.question?.points || 10, [Validators.required, Validators.min(1)]],
    difficulty: [this.data.question?.difficulty || 'MEDIUM'],
    correctAnswer: [this.data.question?.correctAnswer || ''],
    explanation: [this.data.question?.explanation || ''],
    options: this.fb.array([])
  });

  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: { question?: any; quizId: string }) {
    // Watch for question type changes
    this.form.get('questionType')?.valueChanges.subscribe(type => {
      this.questionType.set(type as string);
      this.updateOptionsForType(type as string);
    });

    // Initialize options based on question data or type
    this.initializeOptions();
  }

  initializeOptions(): void {
    const type = this.questionType();
    
    if (this.data.question?.options?.length) {
      // Load existing options
      this.data.question.options.forEach((opt: any) => {
        this.options.push(this.fb.group({
          optionText: [opt.optionText, Validators.required],
          isCorrect: [opt.isCorrect]
        }));
      });
    } else if (type === 'MULTIPLE_CHOICE') {
      // Default 4 options for new multiple choice
      for (let i = 0; i < 4; i++) {
        this.options.push(this.fb.group({
          optionText: ['', Validators.required],
          isCorrect: [i === 0]
        }));
      }
    } else if (type === 'TRUE_FALSE') {
      // Default True/False options
      this.options.push(this.fb.group({
        optionText: ['True', Validators.required],
        isCorrect: [true]
      }));
      this.options.push(this.fb.group({
        optionText: ['False', Validators.required],
        isCorrect: [false]
      }));
    }
  }

  updateOptionsForType(type: string): void {
    this.options.clear();
    
    if (type === 'MULTIPLE_CHOICE') {
      for (let i = 0; i < 4; i++) {
        this.options.push(this.fb.group({
          optionText: ['', Validators.required],
          isCorrect: [i === 0]
        }));
      }
    } else if (type === 'TRUE_FALSE') {
      this.options.push(this.fb.group({
        optionText: ['True', Validators.required],
        isCorrect: [true]
      }));
      this.options.push(this.fb.group({
        optionText: ['False', Validators.required],
        isCorrect: [false]
      }));
    }
  }

  showOptions(): boolean {
    const type = this.questionType();
    return type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE';
  }

  addOption(): void {
    this.options.push(this.fb.group({
      optionText: ['', Validators.required],
      isCorrect: [false]
    }));
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.removeAt(index);
    }
  }

  setCorrectAnswer(index: number): void {
    // Set all to false, then set selected to true
    this.options.controls.forEach((control, i) => {
      control.get('isCorrect')?.setValue(i === index);
    });
  }

  save(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Remove options for non-multiple-choice questions
      if (!this.showOptions()) {
        delete formValue.options;
      }

      this.dialogRef.close(formValue);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
