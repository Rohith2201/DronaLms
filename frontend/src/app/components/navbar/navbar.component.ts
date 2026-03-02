import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LmsStateStore } from '../../core/state-management/lms-state.store';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/realtime/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatTooltipModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar">
      <!-- Left: Sidebar toggle + Breadcrumb -->
      <div class="navbar-left">
        <button mat-icon-button (click)="store.toggleSidebar()" class="toggle-btn"
                matTooltip="Toggle sidebar">
          <mat-icon>{{ store.sidebarCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
        </button>
        <div class="page-title">
          <ng-content select="[slot=title]"></ng-content>
        </div>
      </div>

      <!-- Center: Search (desktop) -->
      <div class="navbar-search" *ngIf="showSearch">
        <mat-icon class="search-icon">search</mat-icon>
        <input placeholder="Search courses, lessons..." class="search-input">
      </div>

      <!-- Right: Actions -->
      <div class="navbar-right">
        <!-- Theme toggle -->
        <button mat-icon-button (click)="store.toggleTheme()"
                [matTooltip]="store.theme() === 'dark' ? 'Light mode' : 'Dark mode'">
          <mat-icon>{{ store.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- Notifications -->
        <button mat-icon-button [matMenuTriggerFor]="notifMenu"
                [matBadge]="(notifService.unreadCount$ | async) || null"
                matBadgeColor="warn" matBadgeSize="small">
          <mat-icon>notifications_outlined</mat-icon>
        </button>

        <!-- User -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
          <div class="user-avatar-sm">
            <mat-icon>person</mat-icon>
          </div>
          <span class="user-name">{{ (auth.currentUser$ | async)?.name }}</span>
          <mat-icon>expand_more</mat-icon>
        </button>
      </div>

      <!-- Notifications Menu -->
      <mat-menu #notifMenu="matMenu" class="notif-menu">
        <div class="notif-header" (click)="$event.stopPropagation()">
          <span>Notifications</span>
          <button mat-button color="primary" (click)="notifService.markAllRead()">Mark all read</button>
        </div>
        <mat-divider></mat-divider>
        <div *ngFor="let n of (notifService.notifications$ | async)?.slice(0, 8)"
             class="notif-item" [class.unread]="!n.read" mat-menu-item>
          <div class="notif-dot" [class]="'dot-' + n.type"></div>
          <div class="notif-content">
            <span class="notif-title">{{ n.title }}</span>
            <span class="notif-time">{{ n.timestamp | date:'shortTime' }}</span>
          </div>
        </div>
        <div *ngIf="!(notifService.notifications$ | async)?.length" class="notif-empty">
          No notifications
        </div>
      </mat-menu>

      <!-- User Menu -->
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item routerLink="/settings"><mat-icon>settings</mat-icon>Settings</button>
        <button mat-menu-item routerLink="/profile"><mat-icon>person</mat-icon>Profile</button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon color="warn">logout</mat-icon>Logout
        </button>
      </mat-menu>
    </header>
  `,
  styles: [`
    .navbar {
      height: var(--topbar-height);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-6);
      position: sticky;
      top: 0;
      z-index: var(--z-topbar);
      flex-shrink: 0;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .toggle-btn { color: var(--text-secondary); }

    .navbar-search {
      flex: 1;
      max-width: 500px;
      display: flex;
      align-items: center;
      background: var(--bg-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 8px 16px;
      gap: var(--space-2);
      transition: all var(--transition-fast);

      &:focus-within {
        border-color: var(--primary);
        background: var(--bg-surface);
        box-shadow: 0 0 0 3px rgba(92,107,192,.12);
      }

      .search-icon { color: var(--text-muted); font-size: 18px; }
      .search-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: var(--text-primary);
        flex: 1;
        &::placeholder { color: var(--text-muted); }
      }
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-left: auto;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      border-radius: var(--radius-full) !important;
      padding: 4px 12px !important;

      .user-name { font-size: 14px; font-weight: 600; }
    }

    .user-avatar-sm {
      width: 28px; height: 28px;
      border-radius: var(--radius-full);
      background: var(--gradient-brand);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px; color: white; }
    }

    /* Notification styles */
    ::ng-deep .notif-menu .mat-mdc-menu-panel { min-width: 340px !important; }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      font-weight: 600;
    }

    .notif-item {
      display: flex !important;
      align-items: flex-start !important;
      gap: 10px !important;
      padding: 8px 16px !important;

      &.unread { background: var(--bg-hover) !important; }
    }

    .notif-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;

      &.dot-success { background: var(--success); }
      &.dot-error   { background: var(--danger); }
      &.dot-warning { background: var(--warning); }
      &.dot-info    { background: var(--info); }
    }

    .notif-content { display: flex; flex-direction: column; gap: 2px; }
    .notif-title { font-size: 13px; }
    .notif-time { font-size: 11px; color: var(--text-muted); }
    .notif-empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }

    @media (max-width: 768px) {
      .navbar-search { display: none; }
      .navbar { padding: 0 var(--space-3); }
    }
  `]
})
export class NavbarComponent {
  readonly store       = inject(LmsStateStore);
  readonly auth        = inject(AuthService);
  readonly notifService = inject(NotificationService);
  showSearch = true;
}
