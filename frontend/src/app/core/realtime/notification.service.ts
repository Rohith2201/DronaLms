import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = new BehaviorSubject<Notification[]>([]);
  readonly notifications$ = this._notifications.asObservable();
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private toastr: ToastrService) {}

  success(title: string, message?: string): void {
    this.toastr.success(message || '', title, { timeOut: 4000, progressBar: true });
    this.push('success', title, message);
  }

  error(title: string, message?: string): void {
    this.toastr.error(message || '', title, { timeOut: 6000, progressBar: true });
    this.push('error', title, message);
  }

  warning(title: string, message?: string): void {
    this.toastr.warning(message || '', title, { timeOut: 5000, progressBar: true });
    this.push('warning', title, message);
  }

  info(title: string, message?: string): void {
    this.toastr.info(message || '', title, { timeOut: 4000, progressBar: true });
    this.push('info', title, message);
  }

  markAllRead(): void {
    const updated = this._notifications.getValue().map(n => ({ ...n, read: true }));
    this._notifications.next(updated);
    this.unreadCount$.next(0);
  }

  clearAll(): void {
    this._notifications.next([]);
    this.unreadCount$.next(0);
  }

  private push(type: ToastType, title: string, message?: string): void {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type, title, message,
      timestamp: new Date(),
      read: false
    };
    const list = [notification, ...this._notifications.getValue()].slice(0, 50);
    this._notifications.next(list);
    this.unreadCount$.next(list.filter(n => !n.read).length);
  }
}
