import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { EntityId, CourseModule } from '../../../core/models';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ModuleDialogComponent } from './module-dialog.component';
import { LessonDialogComponent } from './lesson-dialog.component';
import { QuizDialogComponent } from './quiz-dialog.component';

@Component({
  selector: 'app-manage-content',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
    MatTabsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatMenuModule, MatExpansionModule, MatChipsModule, MatSnackBarModule, DragDropModule
  ],
  template: `
    <div class="manage-content">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button routerLink="/instructor/courses" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1>{{ courseTitle() }}</h1>
          <p>Manage course content, lessons, and quizzes</p>
        </div>
        <div class="header-actions">
          <a mat-stroked-button [routerLink]="['/instructor/courses', courseId, 'analytics']">
            <mat-icon>analytics</mat-icon> View Analytics
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group>
        <!-- Modules & Lessons Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>menu_book</mat-icon> Modules & Lessons
          </ng-template>
          
          <div class="tab-content">
            <div class="tab-header">
              <h3>Course Modules</h3>
              <button mat-flat-button color="primary" (click)="openModuleDialog()">
                <mat-icon>add</mat-icon> Add Module
              </button>
            </div>

            <div class="modules-list" cdkDropList (cdkDropListDropped)="dropModule($event)">
              <mat-expansion-panel *ngFor="let module of modules(); let i = index" cdkDrag>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>
                    <span>{{ i + 1 }}. {{ module.title }}</span>
                    <mat-chip class="lesson-count">{{ getLessonCount(module.id) }} lessons</mat-chip>
                  </mat-panel-title>
                  <mat-panel-description>
                    <button mat-icon-button (click)="openModuleDialog(module); $event.stopPropagation()">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteModule(module.id); $event.stopPropagation()">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <!-- Lessons List -->
                <div class="lessons-container">
                  <div class="lessons-header">
                    <h4>Lessons</h4>
                    <button mat-stroked-button (click)="openLessonDialog(module.id)">
                      <mat-icon>add</mat-icon> Add Lesson
                    </button>
                  </div>

                  <div class="lessons-list" *ngIf="getModuleLessons(module.id).length">
                    <div class="lesson-item" *ngFor="let lesson of getModuleLessons(module.id); let j = index">
                      <div class="lesson-info">
                        <mat-icon class="drag-handle">drag_indicator</mat-icon>
                        <mat-icon>{{ getLessonIcon(lesson.contentType) }}</mat-icon>
                        <div class="lesson-details">
                          <div class="lesson-title">{{ j + 1 }}. {{ lesson.title }}</div>
                          <div class="lesson-meta">
                            <span>{{ lesson.contentType }}</span>
                            <span *ngIf="lesson.durationSeconds">{{ formatDuration(lesson.durationSeconds) }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="lesson-actions">
                        <button mat-icon-button (click)="openLessonDialog(module.id, lesson)">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteLesson(lesson.id)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="empty-state" *ngIf="!getModuleLessons(module.id).length">
                    <mat-icon>video_library</mat-icon>
                    <p>No lessons yet. Add your first lesson.</p>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>

            <div class="empty-state" *ngIf="!modules().length && !loading()">
              <mat-icon>school</mat-icon>
              <h3>No modules yet</h3>
              <p>Start building your course by creating modules and adding lessons.</p>
              <button mat-flat-button color="primary" (click)="openModuleDialog()">
                <mat-icon>add</mat-icon> Create First Module
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Quizzes Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>quiz</mat-icon> Quizzes
          </ng-template>

          <div class="tab-content">
            <div class="tab-header">
              <h3>Course Quizzes</h3>
              <button mat-flat-button color="primary" (click)="openQuizDialog()">
                <mat-icon>add</mat-icon> Create Quiz
              </button>
            </div>

            <div class="quizzes-grid">
              <div class="quiz-card" *ngFor="let quiz of quizzes()">
                <div class="quiz-header">
                  <mat-icon>quiz</mat-icon>
                  <h4>{{ quiz.title }}</h4>
                </div>
                <p class="quiz-description">{{ quiz.description || 'No description' }}</p>
                <div class="quiz-meta">
                  <span><mat-icon>question_answer</mat-icon> {{ getQuestionCount(quiz.id) }} questions</span>
                  <span><mat-icon>grade</mat-icon> {{ quiz.maxScore }} points</span>
                  <span *ngIf="quiz.timeLimitMinutes"><mat-icon>timer</mat-icon> {{ quiz.timeLimitMinutes }} min</span>
                </div>
                <span class="passing-badge">Passing: {{ quiz.passingScore }}%</span>
                <div class="quiz-actions">
                  <button mat-button (click)="manageQuestions(quiz.id)">
                    <mat-icon>edit_note</mat-icon> Questions
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="quizMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #quizMenu="matMenu">
                    <button mat-menu-item (click)="openQuizDialog(quiz)">
                      <mat-icon>edit</mat-icon> Edit Quiz
                    </button>
                    <button mat-menu-item (click)="viewSubmissions(quiz.id)">
                      <mat-icon>assignment</mat-icon> View Submissions
                    </button>
                    <button mat-menu-item (click)="deleteQuiz(quiz.id)" class="danger">
                      <mat-icon color="warn">delete</mat-icon> Delete
                    </button>
                  </mat-menu>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="!quizzes().length && !loading()">
              <mat-icon>quiz</mat-icon>
              <h3>No quizzes yet</h3>
              <p>Create quizzes to test student understanding and knowledge.</p>
              <button mat-flat-button color="primary" (click)="openQuizDialog()">
                <mat-icon>add</mat-icon> Create First Quiz
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <mat-icon class="spinner">hourglass_empty</mat-icon>
        <p>Loading content...</p>
      </div>
    </div>
  `,
  styles: [`
    .manage-content { padding: var(--space-6); max-width: 1400px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6);
      .back-btn { margin-right: var(--space-2); }
      .header-info { flex: 1;
        h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
        p { margin: 4px 0 0; color: var(--text-secondary); font-size: 14px; }
      }
      .header-actions { display: flex; gap: var(--space-2); }
    }

    ::ng-deep .mat-mdc-tab-group { box-shadow: none !important; }
    ::ng-deep .mat-mdc-tab-header { background: var(--bg-surface); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }

    .tab-content { padding: var(--space-6); }

    .tab-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);
      h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    }

    .modules-list {
      display: flex; flex-direction: column; gap: var(--space-3);
      ::ng-deep .mat-expansion-panel {
        box-shadow: none !important; border: 1px solid var(--border); border-radius: var(--radius-lg) !important;
        &.cdk-drag-preview { opacity: 0.9; box-shadow: var(--shadow-xl) !important; }
      }
    }

    .drag-handle { cursor: move; color: var(--text-tertiary); margin-right: var(--space-2); }
    
    ::ng-deep .mat-expansion-panel-header {
      padding: var(--space-4) var(--space-5);
      .mat-expansion-panel-header-title { align-items: center; gap: var(--space-3); }
    }

    .lesson-count { margin-left: auto; font-size: 11px !important; height: 24px !important; }

    .lessons-container { padding: var(--space-4) 0; }
    .lessons-header {
      display: flex; justify-content: space-between; align-items: center; padding: 0 var(--space-4) var(--space-3);
      h4 { margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    }

    .lessons-list { display: flex; flex-direction: column; gap: var(--space-2); }

    .lesson-item {
      display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4);
      background: var(--bg); border-radius: var(--radius-md);
      transition: all 0.2s;
      &:hover { background: var(--bg-hover); }
    }

    .lesson-info {
      display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0;
      mat-icon:not(.drag-handle) { color: var(--primary); }
    }

    .lesson-details { flex: 1; min-width: 0; }
    .lesson-title { font-weight: 500; }
    .lesson-meta {
      display: flex; gap: var(--space-3); font-size: 13px; color: var(--text-secondary); margin-top: 2px;
      span { display: flex; align-items: center; gap: 4px; }
    }

    .lesson-actions { display: flex; gap: var(--space-1); }

    .quizzes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }

    .quiz-card {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-5);
      transition: all 0.2s;
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    }

    .quiz-header {
      display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3);
      mat-icon { color: var(--primary); }
      h4 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    }

    .quiz-description { color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-3); }

    .quiz-meta {
      display: flex; flex-wrap: wrap; gap: var(--space-3); font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-3);
      span { display: flex; align-items: center; gap: 4px;
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .passing-badge {
      display: inline-block; font-size: 11px; font-weight: 600; padding: 4px 12px;
      background: rgba(16,185,129,0.15); color: var(--success); border-radius: var(--radius-full);
      margin-bottom: var(--space-3);
    }

    .quiz-actions { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }

    .danger { color: var(--danger) !important; }

    .empty-state {
      text-align: center; padding: var(--space-16); color: var(--text-secondary);
      mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--text-tertiary); margin-bottom: var(--space-3); }
      h3 { font-size: 1.25rem; margin: 0 0 var(--space-2); color: var(--text-primary); }
      p { margin: 0 0 var(--space-4); }
    }

    .loading {
      padding: var(--space-16); text-align: center; color: var(--text-secondary);
      mat-icon { font-size: 48px; width: 48px; height: 48px; animation: spin 2s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    }

    @media (max-width: 900px) {
      .page-header { flex-wrap: wrap; }
      .quizzes-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ManageContentComponent implements OnInit, OnDestroy  {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  courseId!: EntityId;
  courseTitle = signal('Manage Course');
  loading = signal(true);
  modules = signal<any[]>([]);
  lessons = signal<any[]>([]);
  quizzes = signal<any[]>([]);
  questions = signal<any[]>([]);

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') as string;
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    
    this.api.getCourse(this.courseId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (course) => {
        this.courseTitle.set(course.title || 'Manage Course');
        this.modules.set(course.modules || []);
        
        // Extract all lessons from modules
        const allLessons = course.modules?.flatMap(m => m.lessons || []) ?? [];
        this.lessons.set(allLessons);
        
        // Load quizzes for all modules
        if (course.modules && course.modules.length > 0) {
          const quizStreams = course.modules.map(m => this.api.getQuizzesByModule(m.id));
          forkJoin(quizStreams).subscribe({
            next: (results) => {
              const allQuizzes = results.flat();
              this.quizzes.set(allQuizzes);
              
              // Load questions for all quizzes
              if (allQuizzes.length > 0) {
                const questionStreams = allQuizzes.map(q => this.api.getQuestionsByQuiz(q.id));
                forkJoin(questionStreams).subscribe({
                  next: (questionResults) => {
                    this.questions.set(questionResults.flat());
                    this.loading.set(false);
                  },
                  error: () => this.loading.set(false)
                });
              } else {
                this.loading.set(false);
              }
            },
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.snackBar.open('Failed to load course content', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  dropModule(event: CdkDragDrop<any[]>): void {
    const items = [...this.modules()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.modules.set(items);
    // TODO: Update positions on backend
  }

  getLessonCount(moduleId: string): number {
    return this.lessons().filter(l => l.moduleId === moduleId).length;
  }

  getModuleLessons(moduleId: string): any[] {
    return this.lessons().filter(l => l.moduleId === moduleId);
  }

  getLessonIcon(contentType: string): string {
    const icons: Record<string, string> = {
      VIDEO: 'play_circle',
      PDF: 'picture_as_pdf',
      TEXT: 'article'
    };
    return icons[contentType] || 'description';
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  }

  getQuestionCount(quizId: string): number {
    return this.questions().filter(q => q.quizId === quizId).length;
  }

  openModuleDialog(module?: any): void {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      width: '600px',
      data: { module, courseId: this.courseId }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        if (module) {
          // Update existing module
          this.api.updateModule(module.id, result).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updated) => {
              const index = this.modules().findIndex(m => m.id === module.id);
              if (index !== -1) {
                const newModules = [...this.modules()];
                newModules[index] = updated;
                this.modules.set(newModules);
              }
              this.snackBar.open('Module updated successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error updating module:', err);
              this.snackBar.open('Failed to update module', 'Close', { duration: 3000 });
            }
          });
        } else {
          // Create new module
          this.api.createModule(this.courseId, result).pipe(takeUntil(this.destroy$)).subscribe({
            next: (newModule) => {
              this.modules.set([...this.modules(), newModule]);
              this.snackBar.open('Module created successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error creating module:', err);
              this.snackBar.open('Failed to create module', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  openLessonDialog(moduleId: string, lesson?: any): void {
    const dialogRef = this.dialog.open(LessonDialogComponent, {
      width: '600px',
      data: { lesson, moduleId }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        if (lesson) {
          // Update existing lesson
          this.api.updateLesson(lesson.id, result).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updated) => {
              const index = this.lessons().findIndex(l => l.id === lesson.id);
              if (index !== -1) {
                const newLessons = [...this.lessons()];
                newLessons[index] = updated;
                this.lessons.set(newLessons);
              }
              this.snackBar.open('Lesson updated successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error updating lesson:', err);
              this.snackBar.open('Failed to update lesson', 'Close', { duration: 3000 });
            }
          });
        } else {
          // Create new lesson
          this.api.createLesson(moduleId, result).pipe(takeUntil(this.destroy$)).subscribe({
            next: (newLesson) => {
              this.lessons.set([...this.lessons(), newLesson]);
              this.snackBar.open('Lesson created successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error creating lesson:', err);
              this.snackBar.open('Failed to create lesson', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  deleteModule(id: string): void {
    if (!confirm('Are you sure you want to delete this module? All lessons in this module will also be deleted.')) {
      return;
    }
    
    this.api.deleteModule(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.modules.set(this.modules().filter(m => m.id !== id));
        this.snackBar.open('Module deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting module:', err);
        this.snackBar.open('Failed to delete module', 'Close', { duration: 3000 });
      }
    });
  }

  deleteLesson(id: string): void {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    this.api.deleteLesson(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.lessons.set(this.lessons().filter(l => l.id !== id));
        this.snackBar.open('Lesson deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting lesson:', err);
        this.snackBar.open('Failed to delete lesson', 'Close', { duration: 3000 });
      }
    });
  }

  openQuizDialog(quiz?: any): void {
    const dialogRef = this.dialog.open(QuizDialogComponent, {
      width: '600px',
      data: { quiz, modules: this.modules() }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        const { moduleId, ...quizData } = result;
        
        if (quiz) {
          // Update existing quiz
          this.api.updateQuiz(quiz.id, quizData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (updated) => {
              const index = this.quizzes().findIndex(q => q.id === quiz.id);
              if (index !== -1) {
                const newQuizzes = [...this.quizzes()];
                newQuizzes[index] = updated;
                this.quizzes.set(newQuizzes);
              }
              this.snackBar.open('Quiz updated successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              console.error('Error updating quiz:', err);
              this.snackBar.open('Failed to update quiz', 'Close', { duration: 3000 });
            }
          });
        } else {
          // Create new quiz
          this.api.createQuiz(moduleId, quizData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (newQuiz) => {
              this.quizzes.set([...this.quizzes(), newQuiz]);
              this.snackBar.open('Quiz created successfully', 'Close', { duration: 2000 });
              // Navigate to manage questions page
              setTimeout(() => this.manageQuestions(newQuiz.id), 500);
            },
            error: (err) => {
              console.error('Error creating quiz:', err);
              this.snackBar.open('Failed to create quiz', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  manageQuestions(quizId: string): void {
    this.router.navigate(['/instructor/quizzes', quizId, 'questions']);
  }

  viewSubmissions(quizId: string): void {
    // TODO: Navigate to submissions
    console.log('View submissions', quizId);
    this.snackBar.open('View submissions coming soon', 'Close', { duration: 2000 });
  }

  deleteQuiz(id: string): void {
    if (!confirm('Are you sure you want to delete this quiz? All questions and submissions will also be deleted.')) {
      return;
    }
    
    this.api.deleteQuiz(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.quizzes.set(this.quizzes().filter(q => q.id !== id));
        this.questions.set(this.questions().filter(q => q.quizId !== id));
        this.snackBar.open('Quiz deleted successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting quiz:', err);
        this.snackBar.open('Failed to delete quiz', 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
