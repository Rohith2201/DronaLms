import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LmsStateStore } from '../../core/state-management/lms-state.store';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="main-layout" [class.sidebar-collapsed]="store.sidebarCollapsed()">
      <app-sidebar></app-sidebar>
      <div class="layout-content">
        <app-navbar></app-navbar>
        <main class="page-area scroll-y">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      transition: all var(--transition-base);
    }

    .layout-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: margin-left var(--transition-base);
    }

    .page-area {
      flex: 1;
      overflow-y: auto;
      background: var(--bg-base);
      padding: var(--space-6) var(--space-8);
    }

    @media (max-width: 1024px) {
      .page-area { padding: var(--space-4); }
    }

    @media (max-width: 768px) {
      .main-layout { flex-direction: column; }
      .page-area { padding: var(--space-3); }
    }
  `]
})
export class MainLayoutComponent {
  readonly store = inject(LmsStateStore);
}
