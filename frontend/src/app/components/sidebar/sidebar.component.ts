import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { LmsStateStore } from '../../core/state-management/lms-state.store';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, MatIconModule, MatTooltipModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar" [class.collapsed]="store.sidebarCollapsed()">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <mat-icon>auto_stories</mat-icon>
        </div>
        <span class="logo-text" *ngIf="!store.sidebarCollapsed()">Drona LMS</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav scroll-y">
        <div class="nav-section" *ngFor="let section of navSections()">
          <div class="nav-section-label" *ngIf="!store.sidebarCollapsed()">{{ section.label }}</div>
          <a *ngFor="let item of section.items"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             matRipple
             [matTooltip]="store.sidebarCollapsed() ? item.label : ''"
             matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="!store.sidebarCollapsed()">{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge && !store.sidebarCollapsed()">{{ item.badge }}</span>
          </a>
        </div>
      </nav>

      <!-- User section -->
      <div class="sidebar-user" *ngIf="auth.currentUser$ | async as user">
        <div class="user-avatar">
          <img *ngIf="user.avatarUrl" [src]="user.avatarUrl" [alt]="user.name">
          <mat-icon *ngIf="!user.avatarUrl">person</mat-icon>
        </div>
        <div class="user-info" *ngIf="!store.sidebarCollapsed()">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role badge badge-primary">{{ user.role | titlecase }}</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-base);
      overflow: hidden;
      flex-shrink: 0;
      z-index: var(--z-raised);

      &.collapsed {
        width: var(--sidebar-collapsed);

        .sidebar-logo { justify-content: center; padding: 20px 12px; }
        .sidebar-user  { flex-direction: column; padding: 12px; gap: 4px; }
      }
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 20px var(--space-5);
      border-bottom: 1px solid var(--border-muted);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 36px; height: 36px;
      border-radius: var(--radius-md);
      background: var(--gradient-brand);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px var(--shadow-glow);

      mat-icon { color: white; font-size: 20px; }
    }

    .logo-text {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      white-space: nowrap;
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--space-4) var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .nav-section { display: flex; flex-direction: column; gap: 2px; }

    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: var(--space-2) var(--space-3);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      white-space: nowrap;
      position: relative;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(92, 107, 192, 0.12);
        color: var(--primary);
        font-weight: 600;

        &::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 20px;
          background: var(--primary);
          border-radius: 0 3px 3px 0;
        }

        .nav-icon { color: var(--primary); }
      }
    }

    .nav-icon {
      font-size: 20px;
      width: 20px; height: 20px;
      flex-shrink: 0;
      transition: color var(--transition-fast);
    }

    .nav-label { flex: 1; }

    .nav-badge {
      background: var(--primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      min-width: 18px;
      text-align: center;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-4);
      border-top: 1px solid var(--border-muted);
      flex-shrink: 0;
    }

    .user-avatar {
      width: 36px; height: 36px;
      border-radius: var(--radius-full);
      background: var(--bg-muted);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 2px solid var(--border);

      img { width: 100%; height: 100%; object-fit: cover; }
      mat-icon { color: var(--text-muted); }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        width: 100% !important;
        height: 60px;
        flex-direction: row;
        border-right: none;
        border-top: 1px solid var(--border);
        z-index: var(--z-overlay);

        .sidebar-logo, .sidebar-user, .nav-section-label { display: none; }
        .sidebar-nav { flex-direction: row; padding: 0; justify-content: space-around; }
        .nav-item { flex-direction: column; gap: 2px; font-size: 10px; padding: 8px 12px; }
        .nav-icon { font-size: 22px; }
      }
    }
  `]
})
export class SidebarComponent {
  readonly store = inject(LmsStateStore);
  readonly auth  = inject(AuthService);

  readonly navSections = computed(() => {
    const role = this.auth.userRole();
    if (role === 'STUDENT')    return this.studentNav;
    if (role === 'INSTRUCTOR') return this.instructorNav;
    if (role === 'ADMIN')      return this.adminNav;
    return [];
  });

  private studentNav: { label: string; items: NavItem[] }[] = [
    {
      label: 'Learning',
      items: [
        { label: 'Dashboard',    icon: 'dashboard',     route: '/student/dashboard' },
        { label: 'My Courses',   icon: 'school',        route: '/student/courses' },
        { label: 'Certificates', icon: 'workspace_premium', route: '/student/certificates' },
      ]
    },
    {
      label: 'Explore',
      items: [
        { label: 'Browse Courses', icon: 'explore',    route: '/courses' },
        { label: 'AI Tutor',       icon: 'smart_toy',  route: '/ai-tutor' },
      ]
    }
  ];

  private instructorNav: { label: string; items: NavItem[] }[] = [
    {
      label: 'Teaching',
      items: [
        { label: 'Dashboard',      icon: 'dashboard',    route: '/instructor/dashboard' },
        { label: 'My Courses',     icon: 'menu_book',    route: '/instructor/courses' },
        { label: 'Analytics',      icon: 'analytics',    route: '/instructor/analytics' },
      ]
    }
  ];

  private adminNav: { label: string; items: NavItem[] }[] = [
    {
      label: 'Administration',
      items: [
        { label: 'Dashboard',          icon: 'dashboard',            route: '/admin/dashboard' },
        { label: 'Courses Management', icon: 'library_books',        route: '/admin/courses' },
        { label: 'Users',              icon: 'people',               route: '/admin/users' },
        { label: 'Analytics',          icon: 'analytics',            route: '/admin/analytics' },
        { label: 'Reports',            icon: 'assessment',           route: '/admin/reports' },
      ]
    }
  ];
}
