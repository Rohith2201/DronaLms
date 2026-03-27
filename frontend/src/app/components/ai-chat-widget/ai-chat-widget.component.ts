import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectionStrategy, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../core/api-services/api.service';
import { AiChatMessage, EntityId } from '../../core/models';

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-chat" [class.empty]="messages().length === 0">

      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="ai-avatar"><mat-icon>smart_toy</mat-icon></div>
          <div>
            <div class="chat-title">Drona AI Tutor</div>
            <div class="chat-subtitle">{{ onlineStatus() }}</div>
          </div>
        </div>
        <button mat-icon-button (click)="clearChat()" matTooltip="Clear chat" [disabled]="messages().length === 0">
          <mat-icon>delete_sweep</mat-icon>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="messages-area" #messagesArea>
        <!-- Empty State -->
        <div *ngIf="messages().length === 0" class="empty-state">
          <div class="ai-avatar-lg"><mat-icon>smart_toy</mat-icon></div>
          <h4>Hi! I'm Drona AI</h4>
          <p>Ask me anything about this lesson or topic. I'll help you understand it better.</p>
          <div class="suggestion-chips">
            <button class="chip" *ngFor="let s of suggestions" (click)="sendSuggestion(s)">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-list" *ngIf="messages().length > 0">
          <div
            class="message"
            *ngFor="let msg of messages(); trackBy: trackMsg"
            [class.user-msg]="msg.role === 'user'"
            [class.ai-msg]="msg.role === 'assistant'">

            <div class="msg-avatar" *ngIf="msg.role === 'assistant'">
              <mat-icon>smart_toy</mat-icon>
            </div>

            <div class="msg-bubble">
              <div class="msg-content" [innerHTML]="formatMessage(msg.content)"></div>
              <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
            </div>

            <div class="msg-avatar user-av" *ngIf="msg.role === 'user'">
              <mat-icon>person</mat-icon>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div class="message ai-msg" *ngIf="isTyping()">
            <div class="msg-avatar"><mat-icon>smart_toy</mat-icon></div>
            <div class="msg-bubble typing-bubble">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestion Chips (after first message) -->
      <div class="follow-up-chips" *ngIf="messages().length > 0 && !isTyping()">
        <button class="chip small" *ngFor="let s of quickReplies" (click)="sendSuggestion(s)">{{ s }}</button>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <mat-form-field appearance="outline" class="msg-input-field">
          <input matInput
            [formControl]="inputCtrl"
            placeholder="Ask anything about this lesson..."
            (keydown.enter)="sendMessage()">
          <mat-icon matPrefix>chat_bubble_outline</mat-icon>
        </mat-form-field>
        <button mat-fab color="primary" class="send-btn"
          (click)="sendMessage()"
          [disabled]="!inputCtrl.value?.trim() || isTyping()"
          matTooltip="Send">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ai-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-surface);
    }

    /* Header */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border);
      background: var(--bg-base);
    }

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .ai-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { color: white; font-size: 20px; }
    }

    .chat-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .chat-subtitle { font-size: 11px; color: var(--success); }

    /* Messages */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4);
      scroll-behavior: smooth;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: var(--space-6);
      gap: var(--space-3);
    }

    .ai-avatar-lg {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-2);
      mat-icon { color: white; font-size: 36px; }
    }

    .empty-state h4 { font-size: 1.1rem; color: var(--text-primary); }
    .empty-state p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; max-width: 260px; }

    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      justify-content: center;
      margin-top: var(--space-2);
    }

    .chip {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--primary);
      background: transparent;
      color: var(--primary);
      font-size: 12px;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { background: var(--primary); color: white; }
      &.small { padding: 4px 10px; font-size: 11px; }
    }

    .messages-list { display: flex; flex-direction: column; gap: var(--space-4); }

    .message {
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);

      &.user-msg { flex-direction: row-reverse; }
    }

    .msg-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 16px; color: white; }

      &.user-av { background: linear-gradient(135deg, var(--accent-light, #f97316), var(--accent, #ea580c)); }
    }

    .msg-bubble {
      max-width: 75%;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-size: 13px;
      line-height: 1.6;
    }

    .ai-msg .msg-bubble {
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
      color: var(--text-primary);
    }

    .user-msg .msg-bubble {
      background: linear-gradient(135deg, var(--primary-light), var(--primary));
      color: white;
      border-bottom-right-radius: 4px;
    }

    .msg-content { word-break: break-word; }
    .msg-time {
      font-size: 10px;
      opacity: 0.6;
      margin-top: var(--space-1);
      text-align: right;
    }

    /* Typing Indicator */
    .typing-bubble {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      min-width: 60px;
    }

    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--text-secondary);
      animation: typing-bounce 1.4s infinite ease-in-out;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }

    @keyframes typing-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-8px); opacity: 1; }
    }

    /* Follow-up chips */
    .follow-up-chips {
      padding: 0 var(--space-4) var(--space-2);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    /* Input Area */
    .input-area {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border);
      background: var(--bg-base);
    }

    .msg-input-field { flex: 1; }

    .send-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      flex-shrink: 0;
    }
  `]
})
export class AiChatWidgetComponent implements OnDestroy {
  @ViewChild('messagesArea') messagesArea!: ElementRef<HTMLDivElement>;
  @Input() courseId?: EntityId;
  @Input() lessonId?: EntityId;
  @Input() lessonTitle?: string;

  inputCtrl = new FormControl('');
  messages  = signal<AiChatMessage[]>([]);
  isTyping  = signal(false);
  onlineStatus = signal('Online — ready to help');

  private destroy$ = new Subject<void>();

  suggestions = [
    'Explain this concept simply',
    'What should I know before this lesson?',
    'Give me a real-world example',
    'What are common mistakes here?'
  ];

  quickReplies = [
    'Tell me more',
    'Give an example',
    'Why is this important?'
  ];

  constructor(private api: ApiService) {
    // Enable/disable input based on typing state
    effect(() => {
      if (this.isTyping()) {
        this.inputCtrl.disable();
      } else {
        this.inputCtrl.enable();
      }
    });
  }

  sendSuggestion(text: string): void {
    this.inputCtrl.setValue(text);
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.inputCtrl.value?.trim();
    if (!text || this.isTyping()) return;

    const userMsg: AiChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputCtrl.reset();
    this.isTyping.set(true);
    this.scrollToBottom();

    this.api.aiChat({
      message: text,
      courseId: this.courseId,
      lessonId: this.lessonId,
      context: this.lessonTitle ? `Lesson: ${this.lessonTitle}` : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        const aiMsg: AiChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: res.response || res.message || 'I could not generate a response.',
          timestamp: new Date().toISOString()
        };
        this.messages.update(msgs => [...msgs, aiMsg]);
        this.isTyping.set(false);
        this.scrollToBottom();
      },
      error: () => {
        const errMsg: AiChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
          timestamp: new Date().toISOString()
        };
        this.messages.update(msgs => [...msgs, errMsg]);
        this.isTyping.set(false);
        this.scrollToBottom();
      }
    });
  }

  clearChat(): void {
    this.messages.set([]);
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,.1);padding:2px 4px;border-radius:3px">$1</code>')
      .replace(/\n/g, '<br>');
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  trackMsg(_: number, msg: AiChatMessage): number { return msg.id; }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
