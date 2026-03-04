import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../../core/api-services/api.service';
import { NotificationService } from '../../../core/realtime/notification.service';
import { EntityId, Quiz, Question } from '../../../core/models';

interface QuizResultData {
  quiz: Quiz;
  questions: Question[];
  userAnswers: any[];
  score: number;
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  timeTaken: number; // seconds
  passed: boolean;
  percentage: number;
}

@Component({
  selector: 'app-quiz-result',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-result.component.html',
  styleUrls: ['./quiz-result.component.scss']
})
export class QuizResultComponent implements OnInit {
  result = signal<QuizResultData | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private api: ApiService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    // Get result data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = window.history.state;
    
    if (state && state.quizResult) {
      console.log('=== QUIZ RESULT DATA ===');
      console.log('Result:', state.quizResult);
      console.log('User answers:', state.quizResult.userAnswers);
      console.log('Questions:', state.quizResult.questions.map((q: any, i: number) => ({
        index: i,
        text: q.questionText,
        type: q.type,
        options: q.options?.map((o: any) => o.text) || [],
        userAnswer: state.quizResult.userAnswers[i]
      })));
      
      this.result.set(state.quizResult);
      this.loading.set(false);
    } else {
      // If no state, redirect back
      this.notif.warning('No quiz result found', 'Warning');
      this.router.navigate(['/student/courses']);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  getUserAnswer(questionIndex: number): any {
    const result = this.result();
    if (!result) return null;
    return result.userAnswers[questionIndex];
  }

  isAnswerCorrect(question: Question, userAnswer: any): boolean {
    if (userAnswer === null || userAnswer === undefined) return false;
    
    // Parse correct answer
    const correctAnswer = question.correctAnswer;
    if (!correctAnswer) return false;

    // For MCQ_SINGLE and TRUE_FALSE
    if (question.type === 'MCQ_SINGLE' || question.type === 'TRUE_FALSE') {
      return String(userAnswer) === String(correctAnswer);
    }

    // For MCQ_MULTIPLE - compare arrays
    if (question.type === 'MCQ_MULTIPLE') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const correctAnswerArray = correctAnswer.split(',').map((a: string) => a.trim());
      return JSON.stringify(userAnswerArray.sort()) === JSON.stringify(correctAnswerArray.sort());
    }

    // For SHORT_ANSWER - case insensitive comparison
    if (question.type === 'SHORT_ANSWER') {
      return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
    }

    return false;
  }

  getCorrectOptionText(question: Question): string {
    const correctAnswer = question.correctAnswer;
    if (!correctAnswer) return 'N/A';

    if (question.type === 'TRUE_FALSE') {
      return correctAnswer;
    }

    if (question.type === 'SHORT_ANSWER') {
      return correctAnswer;
    }

    // For MCQ types, find option text by ID
    const options = question.options || [];
    if (question.type === 'MCQ_SINGLE') {
      const option = options.find(opt => String(opt.id) === String(correctAnswer) || opt.text === correctAnswer);
      return option ? option.text : correctAnswer;
    }

    if (question.type === 'MCQ_MULTIPLE') {
      const correctIds = correctAnswer.split(',').map(a => a.trim());
      const correctOptions = options.filter(opt => 
        correctIds.includes(String(opt.id)) || correctIds.includes(opt.text)
      );
      return correctOptions.map(o => o.text).join(', ');
    }

    return correctAnswer;
  }

  getUserAnswerText(question: Question, userAnswer: any): string {
    console.log('Getting answer text for:', question.questionText, '| User answer:', userAnswer, '| Options:', question.options?.map(o => o.text));
    
    if (userAnswer === null || userAnswer === undefined) return 'Not Answered';

    if (question.type === 'TRUE_FALSE') {
      return String(userAnswer);
    }

    if (question.type === 'SHORT_ANSWER') {
      return String(userAnswer || '');
    }

    const options = question.options || [];
    if (question.type === 'MCQ_SINGLE') {
      const option = options.find(opt => String(opt.id) === String(userAnswer) || opt.text === userAnswer);
      console.log('MCQ_SINGLE: Found option:', option, 'for answer:', userAnswer);
      return option ? option.text : String(userAnswer);
    }

    if (question.type === 'MCQ_MULTIPLE') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const selectedOptions = options.filter(opt => 
        userAnswerArray.includes(String(opt.id)) || userAnswerArray.includes(opt.text)
      );
      return selectedOptions.map(o => o.text).join(', ');
    }

    return String(userAnswer);
  }
}
