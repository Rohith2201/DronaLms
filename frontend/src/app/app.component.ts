import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LmsStateStore } from './core/state-management/lms-state.store';
import { AuthService } from './core/auth/auth.service';
import { RealtimeService } from './core/realtime/realtime.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private store    = inject(LmsStateStore);
  private auth     = inject(AuthService);
  private realtime = inject(RealtimeService);

  ngOnInit(): void {
    // Apply persisted theme immediately
    const theme = this.store.theme();
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme';

    // Connect WebSocket if logged in
    if (this.auth.isLoggedIn()) {
      this.realtime.connect();
    }
  }
}
