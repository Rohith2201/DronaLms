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
            <mat-option value="MCQ_SINGLE">Multiple Choice (Single Answer)</mat-option>
            <mat-option value="MCQ_MULTIPLE">Multiple Choice (Multiple Answers)</mat-option>
            <mat-option value="TRUE_FALSE">True/False</mat-option>
            <mat-option value="SHORT_ANSWER">Short Answer</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Options (for MCQ and TRUE_FALSE) -->
        <div *ngIf="showOptions()" class="options-section">
          <div class="section-header">
            <h4>Answer Options</h4>
            <button *ngIf="questionType() === 'MCQ_SINGLE' || questionType() === 'MCQ_MULTIPLE'" 
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

              <!-- Use radio for single choice, checkbox for multiple -->
              <mat-radio-button *ngIf="questionType() === 'MCQ_SINGLE'"
                                [value]="i" 
                                [checked]="opt.get('isCorrect')?.value"
                                (change)="setCorrectAnswer(i)"
                                color="primary">
                Correct
              </mat-radio-button>

              <mat-checkbox *ngIf="questionType() === 'MCQ_MULTIPLE' || questionType() === 'TRUE_FALSE'"
                            formControlName="isCorrect"
                            color="primary">
                Correct
              </mat-checkbox>

              <button *ngIf="(questionType() === 'MCQ_SINGLE' || questionType() === 'MCQ_MULTIPLE') && options.length > 2" 
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

        <!-- Points -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Points</mat-label>
          <input matInput type="number" formControlName="points" min="1" step="1">
          <mat-error *ngIf="form.get('points')?.hasError('required')">Required</mat-error>
          <mat-hint>Points awarded for correct answer</mat-hint>
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

  questionType = signal(this.data.question?.questionType || 'MCQ_SINGLE');

  form = this.fb.group({
    questionText: [this.data.question?.questionText || '', Validators.required],
    questionType: [this.data.question?.questionType || 'MCQ_SINGLE', Validators.required],
    points: [this.data.question?.points || 10, [Validators.required, Validators.min(1)]],
    correctAnswer: [this.data.question?.correctAnswer || ''],
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
    
    if (this.data.question?.optionsJson) {
      // Load existing options from JSON string
      try {
        const options = JSON.parse(this.data.question.optionsJson);
        options.forEach((opt: any) => {
          this.options.push(this.fb.group({
            optionText: [opt.text || opt.optionText, Validators.required],
            isCorrect: [opt.isCorrect || false]
          }));
        });
      } catch (e) {
        console.error('Failed to parse options JSON:', e);
      }
    } else if (type === 'MCQ_SINGLE' || type === 'MCQ_MULTIPLE') {
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
    
    if (type === 'MCQ_SINGLE' || type === 'MCQ_MULTIPLE') {
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
    return type === 'MCQ_SINGLE' || type === 'MCQ_MULTIPLE' || type === 'TRUE_FALSE';
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
      
      // Prepare data for backend
      const questionData: any = {
        questionText: formValue.questionText,
        questionType: formValue.questionType,
        points: formValue.points,
        correctAnswer: formValue.correctAnswer || null
      };

      // Convert options array to JSON string for backend
      if (this.showOptions() && formValue.options && formValue.options.length > 0) {
        const optionsArray = formValue.options.map((opt: any) => ({
          text: opt.optionText,
          isCorrect: opt.isCorrect || false
        }));
        questionData.optionsJson = JSON.stringify(optionsArray);
      }

      this.dialogRef.close(questionData);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
