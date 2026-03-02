import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, timer, switchMap, takeUntil, share, retry } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../auth/auth.service';
import { WebSocketMessage, RealtimeProgressEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private ws: WebSocket | null = null;
  private destroy$ = new Subject<void>();
  private reconnectDelay = 3000;

  private _messages$ = new Subject<WebSocketMessage>();
  readonly messages$ = this._messages$.asObservable().pipe(share());

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const token = this.auth.getToken();
    const url = `${environment.wsUrl}?token=${token}`;
    this.createConnection(url);
  }

  private createConnection(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.info('[WS] Connected to Drona LMS realtime');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data);
        this._messages$.next(msg);
      } catch (e) {
        console.warn('[WS] Failed to parse message', e);
      }
    };

    this.ws.onclose = () => {
      console.warn('[WS] Disconnected – reconnecting in', this.reconnectDelay, 'ms');
      if (!this.destroy$.closed) {
        timer(this.reconnectDelay)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.createConnection(url));
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // exponential back-off
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error', err);
    };
  }

  send<T>(type: string, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
  }

  onType<T>(type: string): Observable<T> {
    return new Observable<T>(observer => {
      const sub = this.messages$.subscribe(msg => {
        if (msg.type === type) observer.next(msg.payload as T);
      });
      return () => sub.unsubscribe();
    });
  }

  onProgressUpdate(): Observable<RealtimeProgressEvent> {
    return this.onType<RealtimeProgressEvent>('PROGRESS_UPDATE');
  }

  disconnect(): void {
    this.destroy$.next();
    this.ws?.close();
    this.ws = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.complete();
  }
}
