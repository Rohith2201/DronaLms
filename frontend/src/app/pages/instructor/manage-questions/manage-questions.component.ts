import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { QuestionDialogComponent } from './question-dialog.component';

@Component({
  selector: 'app-manage-questions',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatCardModule, MatChipsModule, MatMenuModule, MatSnackBarModule
  ],
  template: `
    <div class="manage-questions">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1>{{ quizTitle() }}</h1>
          <p>Manage quiz questions and answers</p>
        </div>
        <div class="header-actions">
          <button mat-flat-button color="primary" (click)="openQuestionDialog()">
            <mat-icon>add</mat-icon> Add Question
          </button>
        </div>
      </div>

      <!-- Questions List -->
      <div class="questions-container">
        <div *ngIf="loading()" class="loading-state">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Loading questions...</p>
        </div>

        <div *ngIf="!loading() && questions().length === 0" class="empty-state">
          <mat-icon>quiz</mat-icon>
          <h3>No Questions Yet</h3>
          <p>Start building your quiz by adding questions</p>
          <button mat-flat-button color="primary" (click)="openQuestionDialog()">
            <mat-icon>add</mat-icon> Add First Question
          </button>
        </div>

        <div class="questions-list" *ngIf="!loading() && questions().length > 0">
          <mat-card *ngFor="let question of questions(); let i = index" class="question-card">
            <mat-card-header>
              <div class="question-number">Q{{ i + 1 }}</div>
              <div class="question-type">
                <mat-chip [color]="getTypeColor(question.questionType)">
                  {{ getTypeLabel(question.questionType) }}
                </mat-chip>
              </div>
              <div class="question-actions">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openQuestionDialog(question)">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-menu-item (click)="deleteQuestion(question.id)">
                    <mat-icon>delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="question-text">{{ question.questionText }}</div>
              
              <div class="options-list" *ngIf="getQuestionOptions(question).length">
                <div *ngFor="let opt of getQuestionOptions(question); let j = index" 
                     class="option-item"
                     [class.correct]="opt.isCorrect">
                  <div class="option-number">{{ getOptionLetter(j) }}</div>
                  <div class="option-text">{{ opt.text }}</div>
                  <mat-icon *ngIf="opt.isCorrect" class="correct-icon">check_circle</mat-icon>
                </div>
              </div>

              <div class="question-footer">
                <div class="points">
                  <mat-icon>star</mat-icon>
                  {{ question.points }} points
                </div>
                <div class="difficulty" *ngIf="question.difficulty">
                  {{ question.difficulty }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manage-questions {
      padding: var(--space-6);
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-8);

      .back-btn {
        flex-shrink: 0;
      }

      .header-info {
        flex: 1;

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
        }

        p {
          margin: var(--space-1) 0 0;
          color: var(--text-secondary);
        }
      }

      .header-actions {
        display: flex;
        gap: var(--space-2);
      }
    }

    .questions-container {
      margin-top: var(--space-6);
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: var(--space-16) var(--space-8);

      mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: var(--text-secondary);
        opacity: 0.5;
      }

      h3 {
        margin: var(--space-4) 0 var(--space-2);
        font-size: 1.5rem;
      }

      p {
        color: var(--text-secondary);
        margin: 0 0 var(--space-6);
      }
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .question-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);

        .question-number {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--primary);
          min-width: 40px;
        }

        .question-type {
          flex: 1;
        }

        .question-actions {
          margin-left: auto;
        }
      }

      .question-text {
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: var(--space-4);
        font-weight: 500;
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--bg-surface);
        border: 2px solid var(--border);
        border-radius: var(--radius-lg);
        transition: all 0.2s;

        &.correct {
          background: rgba(16, 185, 129, 0.08);
          border-color: var(--success);
        }

        .option-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .option-text {
          flex: 1;
        }

        .correct-icon {
          color: var(--success);
          flex-shrink: 0;
        }
      }

      .question-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: var(--space-3);
        border-top: 1px solid var(--border);

        .points {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-weight: 600;
          color: var(--primary);

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .difficulty {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }
      }
    }
  `]
})
export class ManageQuestionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  quizId = '';
  quizTitle = signal('Quiz Questions');
  questions = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('quizId') || '';
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQuestions(): void {
    this.api.getQuestionsByQuiz(this.quizId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.loading.set(false);
        this.snackBar.open('Failed to load questions', 'Close', { duration: 3000 });
      }
    });

    // Also get quiz details for title
    this.api.getQuiz(this.quizId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (quiz) => {
        this.quizTitle.set(quiz.title);
      }
    });
  }

  openQuestionDialog(question?: any): void {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { question, quizId: this.quizId }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        if (question) {
          // Update existing question
          this.api.updateQuestion(question.id, result).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updated) => {
              const index = this.questions().findIndex(q => q.id === question.id);
              if (index !== -1) {
                const newQuestions = [...this.questions()];
                newQuestions[index] = updated;
                this.questions.set(newQuestions);
              }
              this.snackBar.open('Question updated successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error updating question:', err);
              this.snackBar.open('Failed to update question', 'Close', { duration: 3000 });
            }
          });
        } else {
          // Create new question - add position field
          const questionData = {
            ...result,
            position: this.questions().length + 1
          };
          this.api.createQuestion(this.quizId, questionData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (newQuestion) => {
              this.questions.set([...this.questions(), newQuestion]);
              this.snackBar.open('Question added successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error creating question:', err);
              this.snackBar.open('Failed to add question', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  deleteQuestion(id: string): void {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    this.api.deleteQuestion(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.questions.set(this.questions().filter(q => q.id !== id));
        this.snackBar.open('Question deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting question:', err);
        this.snackBar.open('Failed to delete question', 'Close', { duration: 3000 });
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'MCQ_SINGLE': 'Multiple Choice',
      'MCQ_MULTIPLE': 'Multiple Choice (Multi)',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer'
    };
    return labels[type] || type;
  }

  getQuestionOptions(question: any): any[] {
    if (!question.optionsJson) return [];
    try {
      return JSON.parse(question.optionsJson);
    } catch (e) {
      console.error('Failed to parse options JSON:', e);
      return [];
    }
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'MCQ_SINGLE': 'primary',
      'MCQ_MULTIPLE': 'accent',
      'TRUE_FALSE': 'warn',
      'SHORT_ANSWER': ''
    };
    return colors[type] || '';
  }

  goBack(): void {
    this.router.navigate(['/instructor/courses']);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
