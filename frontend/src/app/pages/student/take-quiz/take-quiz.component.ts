import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, HostListener, signal, Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, interval, takeUntil, fromEvent } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { NotificationService } from '../../../core/realtime/notification.service';
import { EntityId, Quiz, Question } from '../../../core/models';

type QuizMode = 'single' | 'all';

@Component({
  selector: 'app-take-quiz',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatCheckboxModule,
    MatInputModule, MatFormFieldModule, MatProgressBarModule, MatDialogModule,
    MatCardModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.scss']
})
export class TakeQuizComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private timerSubscription?: any;
  
  quiz?: Quiz;
  questions: Question[] = [];
  quizForm!: FormGroup;
  loading = signal(true);
  
  // Quiz state
  quizMode: QuizMode = 'single';
  currentQuestionIndex = 0;
  timeRemaining = signal(0); // seconds
  isFullscreen = signal(false);
  isNetworkOnline = signal(true);
  isPaused = signal(false);
  hasStarted = signal(false);
  hasSubmitted = signal(false);
  
  // Anti-cheating tracking
  tabSwitchCount = 0;
  copyAttempts = 0;
  maxTabSwitches = 3;
  
  // Warning flags
  showTabWarning = signal(false);
  showNetworkWarning = signal(false);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private api: ApiService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private notif: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('quizId');    console.log('Quiz ID from route:', quizId);
        if (!quizId) {
      this.notif.error('Invalid quiz ID', 'Error');
      this.router.navigate(['/student/courses']);
      return;
    }

    this.loadQuiz(quizId);
    this.setupNetworkMonitoring();
    this.setupVisibilityMonitoring();
    this.preventCopyPaste();
  }

  private loadQuiz(quizId: EntityId): void {
    console.log('Loading quiz with ID:', quizId);
    this.loading.set(true);
    this.api.getQuizById(quizId).subscribe({
      next: (quiz) => {
        console.log('Quiz loaded:', quiz);
        console.log('Questions received:', quiz.questions);
        
        this.quiz = quiz;
        // Parse options from optionsJson string for each question
        this.questions = (quiz.questions || []).map(q => {
          const parsedOptions = q.optionsJson ? this.parseOptions(q.optionsJson) : (q.options || []);
          console.log(`Question "${q.questionText}" - Type: ${q.questionType}, Options:`, parsedOptions);
          return {
            ...q,
            options: parsedOptions,
            text: q.questionText,  // Add alias for template compatibility
            type: q.questionType   // Add alias for template compatibility
          };
        });
        
        console.log('Final questions array:', this.questions);
        
        if (this.questions.length === 0) {
          this.notif.warning('This quiz has no questions yet', 'Warning');
        }
        
        this.timeRemaining.set((quiz.timeLimitMinutes || 60) * 60);
        this.initializeForm();
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading quiz:', err);
        this.loading.set(false);
        this.notif.error('Failed to load quiz', 'Error');
        this.router.navigate(['/student/courses']);
      }
    });
  }

  private parseOptions(optionsJson: string): any[] {
    try {
      return JSON.parse(optionsJson);
    } catch (e) {
      console.error('Error parsing options:', e);
      return [];
    }
  }

  getOptionValue(option: any): string {
    return String(option.id || option.text);
  }

  onCheckboxChange(event: any, questionIndex: number, optionValue: string): void {
    const control = this.answers.at(questionIndex);
    let currentValue = control.value;
    
    // Initialize as array if null/undefined
    if (!Array.isArray(currentValue)) {
      currentValue = currentValue ? [currentValue] : [];
    }
    
    if (event.checked) {
      // Add option if not already present
      if (!currentValue.includes(optionValue)) {
        currentValue.push(optionValue);
      }
    } else {
      // Remove option
      currentValue = currentValue.filter((val: string) => val !== optionValue);
    }
    
    control.setValue(currentValue.length > 0 ? currentValue : null);
    this.cdr.markForCheck();
  }

  isOptionSelected(questionIndex: number, optionValue: string): boolean {
    const control = this.answers.at(questionIndex);
    const value = control.value;
    
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    
    return value === optionValue;
  }

  private initializeForm(): void {
    const answerControls = this.questions.map((q, idx) => {
      console.log(`Creating control for Q${idx}: ${q.questionText}`);
      return this.fb.control(null);
    });
    this.quizForm = this.fb.group({
      answers: this.fb.array(answerControls)
    });
    
    console.log('Form initialized with', answerControls.length, 'controls');
    
    // Debug: Monitor form changes
    this.quizForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      console.log('Form value changed - All answers:', JSON.stringify(value.answers));
    });
    
    // Monitor each answer control individually
    this.answers.controls.forEach((control, index) => {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
        console.log(`Answer[${index}] changed to:`, val, `| Question: ${this.questions[index]?.questionText}`);
      });
    });
  }

  get answers(): FormArray {
    return this.quizForm.get('answers') as FormArray;
  }

  showTermsAndStart(mode: QuizMode): void {
    this.quizMode = mode;
    
    const dialogRef = this.dialog.open(QuizTermsDialog, {
      width: '600px',
      disableClose: true,
      data: {
        quizTitle: this.quiz?.title,
        duration: this.quiz?.timeLimitMinutes,
        questionsCount: this.questions.length,
        passingScore: this.quiz?.passingScore
      }
    });

    dialogRef.afterClosed().subscribe((accepted: boolean) => {
      if (accepted) {
        this.startQuiz();
      }
    });
  }

  private async startQuiz(): Promise<void> {
    try {
      await this.enterFullscreen();
      this.hasStarted.set(true);
      this.startTimer();
      this.notif.success('Quiz started!', 'Good luck');
      this.cdr.markForCheck();
    } catch (err) {
      this.notif.error('Please allow fullscreen to start the quiz', 'Error');
    }
  }

  private async enterFullscreen(): Promise<void> {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      this.isFullscreen.set(true);
    }
  }

  private exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      this.isFullscreen.set(false);
    }
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isPaused() && this.isNetworkOnline()) {
          const remaining = this.timeRemaining() - 1;
          this.timeRemaining.set(remaining);
          
          if (remaining <= 0) {
            this.autoSubmitQuiz();
          } else if (remaining === 60) {
            this.notif.warning('1 minute remaining!', 'Time Alert');
          } else if (remaining === 300) {
            this.notif.warning('5 minutes remaining!', 'Time Alert');
          }
          
          this.cdr.markForCheck();
        }
      });
  }

  private setupNetworkMonitoring(): void {
    fromEvent(window, 'online')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isNetworkOnline.set(true);
        this.showNetworkWarning.set(false);
        this.notif.success('Connection restored', 'Network');
        this.cdr.markForCheck();
      });

    fromEvent(window, 'offline')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isNetworkOnline.set(false);
        this.showNetworkWarning.set(true);
        this.notif.error('Connection lost - Timer paused', 'Network');
        this.cdr.markForCheck();
      });
  }

  private setupVisibilityMonitoring(): void {
    document.addEventListener('visibilitychange', () => {
      if (this.hasStarted() && !this.hasSubmitted()) {
        if (document.hidden) {
          this.tabSwitchCount++;
          this.showTabWarning.set(true);
          
          if (this.tabSwitchCount >= this.maxTabSwitches) {
            this.notif.error(`You switched tabs ${this.tabSwitchCount} times. Quiz will be auto-submitted.`, 'Warning');
            setTimeout(() => this.autoSubmitQuiz(), 2000);
          } else {
            this.notif.warning(
              `Tab switch detected (${this.tabSwitchCount}/${this.maxTabSwitches}). Stay on this page!`,
              'Warning'
            );
          }
          this.cdr.markForCheck();
        }
      }
    });
  }

  private preventCopyPaste(): void {
    document.addEventListener('copy', (e) => {
      if (this.hasStarted() && !this.hasSubmitted()) {
        e.preventDefault();
        this.copyAttempts++;
        this.notif.warning('Copying is disabled during the quiz', 'Restricted');
      }
    });

    document.addEventListener('cut', (e) => {
      if (this.hasStarted() && !this.hasSubmitted()) {
        e.preventDefault();
        this.notif.warning('Cutting is disabled during the quiz', 'Restricted');
      }
    });
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement && this.hasStarted() && !this.hasSubmitted()) {
      this.notif.error('Fullscreen exited - Quiz auto-submitted', 'Warning');
      setTimeout(() => this.autoSubmitQuiz(), 1000);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasStarted() && !this.hasSubmitted()) {
      $event.returnValue = 'Your quiz is in progress. Are you sure you want to leave?';
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      console.log('Next question - Current answers:', this.quizForm.value.answers);
      this.currentQuestionIndex++;
      this.cdr.markForCheck();
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      console.log('Previous question - Current answers:', this.quizForm.value.answers);
      this.currentQuestionIndex--;
      this.cdr.markForCheck();
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
    this.cdr.markForCheck();
  }

  isQuestionAnswered(index: number): boolean {
    const value = this.answers.at(index).value;
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  get answeredCount(): number {
    return this.questions.filter((_, i) => this.isQuestionAnswered(i)).length;
  }

  get progressPercent(): number {
    return (this.answeredCount / this.questions.length) * 100;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  submitQuiz(): void {
    if (!this.quizForm.valid) {
      const confirmed = confirm('Some questions are unanswered. Submit anyway?');
      if (!confirmed) return;
    }

    this.performSubmit();
  }

  private autoSubmitQuiz(): void {
    this.notif.warning('Time is up! Auto-submitting quiz...', 'Time Out');
    this.performSubmit();
  }

  private performSubmit(): void {
    this.hasSubmitted.set(true);
    this.timerSubscription?.unsubscribe();
    
    const userAnswers = this.quizForm.value.answers;
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Form value:', this.quizForm.value);
    console.log('User answers array:', userAnswers);
    console.log('Questions with options:', this.questions.map((q, i) => ({ 
      index: i, 
      type: q.type, 
      text: q.questionText,
      options: q.options?.map(o => o.text) || [],
      correctAnswer: q.correctAnswer
    })));
    
    const timeTaken = ((this.quiz?.timeLimitMinutes || 60) * 60) - this.timeRemaining();

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let totalPoints = 0;

    this.questions.forEach((question, index) => {
      totalPoints += Number(question.points) || 0;
      const userAnswer = userAnswers[index];
      console.log(`Q${index + 1} (${question.questionText}): User answered:`, userAnswer, '| Correct:', question.correctAnswer, '| Is correct:', this.isAnswerCorrect(question, userAnswer));
      
      if (this.isAnswerCorrect(question, userAnswer)) {
        correctCount++;
        score += Number(question.points) || 0;
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = percentage >= (this.quiz?.passingScore || 60);

    const resultData = {
      quiz: this.quiz!,
      questions: this.questions,
      userAnswers: userAnswers,
      score: score,
      totalPoints: totalPoints,
      correctCount: correctCount,
      wrongCount: this.questions.length - correctCount,
      timeTaken: timeTaken,
      passed: passed,
      percentage: percentage
    };

    console.log('Quiz Result:', resultData);

    // TODO: Call actual submission API
    // this.api.submitQuiz(submission).subscribe(...)
    
    this.exitFullscreen();
    this.notif.success('Quiz submitted successfully!', 'Success');
    
    // Navigate to results page with data
    setTimeout(() => {
      this.router.navigate(['/student/quiz-result', this.quiz?.id], {
        state: { quizResult: resultData }
      });
    }, 1500);
  }

  private isAnswerCorrect(question: Question, userAnswer: any): boolean {
    if (userAnswer === null || userAnswer === undefined) return false;
    
    const correctAnswer = question.correctAnswer;
    if (!correctAnswer) return false;

    // For MCQ_SINGLE and TRUE_FALSE
    if (question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE') {
      return String(userAnswer) === String(correctAnswer);
    }

    // For MCQ_MULTIPLE - compare arrays
    if (question.type === 'MCQ_MULTIPLE') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const correctAnswerArray = correctAnswer.split(',').map(a => a.trim());
      return JSON.stringify(userAnswerArray.sort()) === JSON.stringify(correctAnswerArray.sort());
    }

    // For SHORT_ANSWER - case insensitive comparison
    if (question.type === 'SHORT_ANSWER') {
      return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
    }

    return false;
  }

  exitQuiz(): void {
    if (!this.hasSubmitted()) {
      const confirmed = confirm('Are you sure you want to exit? Your quiz will be submitted.');
      if (confirmed) {
        this.autoSubmitQuiz();
      }
    } else {
      this.router.navigate(['/student/courses']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timerSubscription?.unsubscribe();
    this.exitFullscreen();
  }
}

// Terms and Conditions Dialog Component
@Component({
  selector: 'quiz-terms-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatCheckboxModule, ReactiveFormsModule, FormsModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>gavel</mat-icon>
      Quiz Terms & Conditions
    </h2>
    <mat-dialog-content>
      <div class="quiz-info">
        <h3>{{ data.quizTitle }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <mat-icon>timer</mat-icon>
            <span>Duration: {{ data.duration }} minutes</span>
          </div>
          <div class="info-item">
            <mat-icon>quiz</mat-icon>
            <span>Questions: {{ data.questionsCount }}</span>
          </div>
          <div class="info-item">
            <mat-icon>emoji_events</mat-icon>
            <span>Passing Score: {{ data.passingScore }}%</span>
          </div>
        </div>
      </div>

      <div class="terms-section">
        <h4>Important Rules:</h4>
        <ul>
          <li><strong>Fullscreen Mode:</strong> The quiz will open in fullscreen. Exiting fullscreen will auto-submit your quiz.</li>
          <li><strong>Timer:</strong> A countdown timer will be visible. You must submit before time runs out.</li>
          <li><strong>Tab Switching:</strong> Switching tabs is restricted. After 3 switches, your quiz will be auto-submitted.</li>
          <li><strong>Copy/Paste:</strong> Copying and pasting content is disabled during the quiz.</li>
          <li><strong>Network:</strong> If your network fails, the timer will pause automatically.</li>
          <li><strong>No Cheating:</strong> Your activity is monitored. Any suspicious behavior will be flagged.</li>
          <li><strong>Save Progress:</strong> Your answers are not saved until you click Submit.</li>
          <li><strong>One Attempt:</strong> You cannot retake this quiz once submitted.</li>
        </ul>
      </div>

      <div class="acceptance">
        <mat-checkbox [(ngModel)]="accepted" [ngModelOptions]="{standalone: true}">
          I have read and agree to follow all the rules mentioned above
        </mat-checkbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="decline()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!accepted" (click)="accept()">
        Start Quiz <mat-icon>fullscreen</mat-icon>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .quiz-info {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .quiz-info h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .info-item mat-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .terms-section {
      margin: 20px 0;
    }

    .terms-section h4 {
      color: #d32f2f;
      margin-bottom: 12px;
    }

    .terms-section ul {
      list-style: none;
      padding: 0;
    }

    .terms-section li {
      margin-bottom: 12px;
      padding-left: 20px;
      position: relative;
      font-size: 14px;
      line-height: 1.6;
    }

    .terms-section li:before {
      content: '⚠️';
      position: absolute;
      left: 0;
    }

    .terms-section strong {
      color: #d32f2f;
    }

    .acceptance {
      margin-top: 20px;
      padding: 16px;
      background: #fff3cd;
      border-left: 4px solid #ff9800;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }
  `]
})
export class QuizTermsDialog {
  accepted = false;

  constructor(
    private dialogRef: MatDialogRef<QuizTermsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  accept(): void {
    this.dialogRef.close(true);
  }

  decline(): void {
    this.dialogRef.close(false);
  }
}
