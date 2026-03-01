import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, inject, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ApiService } from '../../../core/api-services/api.service';
import { User, UserRole } from '../../../core/models';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatSelectModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatChipsModule, MatTooltipModule, MatProgressSpinnerModule, MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="users-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p>{{ total() | number }} total users</p>
        </div>
        <button mat-icon-button (click)="loadUsers()" matTooltip="Refresh">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchCtrl" placeholder="Search by name or email...">
        </mat-form-field>
        <mat-form-field appearance="outline" class="role-select">
          <mat-label>Role</mat-label>
          <mat-select [formControl]="roleCtrl">
            <mat-option value="">All Roles</mat-option>
            <mat-option value="STUDENT">Student</mat-option>
            <mat-option value="INSTRUCTOR">Instructor</mat-option>
            <mat-option value="ADMIN">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="table-loading" *ngIf="loading()">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table mat-table [dataSource]="users()" class="users-table" *ngIf="!loading()">
          <!-- Avatar + Name -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <div class="avatar">{{ getInitials(u) }}</div>
                <div class="user-details">
                  <span class="user-name">{{ u.firstName }} {{ u.lastName }}</span>
                  <span class="user-email">{{ u.email }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Role -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <span class="role-chip {{ u.role?.toLowerCase() }}">{{ u.role }}</span>
            </td>
          </ng-container>

          <!-- Joined -->
          <ng-container matColumnDef="joined">
            <th mat-header-cell *matHeaderCellDef>Joined</th>
            <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'mediumDate' }}</td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span class="status-dot" [class.active]="u.active" [class.inactive]="!u.active">
                {{ u.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button [matMenuTriggerFor]="userMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #userMenu>
                <button mat-menu-item (click)="changeRole(u, 'STUDENT')"><mat-icon>person</mat-icon> Set Student</button>
                <button mat-menu-item (click)="changeRole(u, 'INSTRUCTOR')"><mat-icon>school</mat-icon> Set Instructor</button>
                <button mat-menu-item (click)="changeRole(u, 'ADMIN')"><mat-icon>admin_panel_settings</mat-icon> Set Admin</button>
                <mat-divider></mat-divider>
                <button mat-menu-item class="danger-item" (click)="toggleActive(u)">
                  <mat-icon>{{ u.active ? 'block' : 'check_circle' }}</mat-icon>
                  {{ u.active ? 'Deactivate' : 'Activate' }}
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- Empty -->
        <div class="table-empty" *ngIf="!loading() && users().length === 0">
          <mat-icon>people_outline</mat-icon>
          <p>No users found</p>
        </div>

        <!-- Paginator -->
        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)"
          *ngIf="!loading() && total() > pageSize">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .users-page { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6);
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
      p { color: var(--text-secondary); margin: 4px 0 0; font-size: 14px; }
    }

    .filter-row { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4); }
    .search-field { flex: 1; min-width: 200px; }
    .role-select { width: 160px; }

    .table-container { background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid var(--border); overflow: hidden; position: relative; }

    .table-loading { display: flex; justify-content: center; padding: var(--space-12); }

    .users-table { width: 100%; }

    .mat-mdc-header-row { background: var(--bg-base) !important; }
    .mat-mdc-header-cell { font-size: 12px !important; font-weight: 600 !important; color: var(--text-secondary) !important; text-transform: uppercase; letter-spacing: 0.5px; }
    .mat-mdc-row { transition: background var(--transition-fast); &:hover { background: var(--bg-base) !important; } }
    .mat-mdc-cell { font-size: 14px; }

    .user-cell { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 14px; font-weight: 500; }
    .user-email { font-size: 12px; color: var(--text-secondary); }

    .role-chip {
      padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600;
      &.student    { background: rgba(59,130,246,.15); color: #1d4ed8; }
      &.instructor { background: rgba(139,92,246,.15); color: #6d28d9; }
      &.admin      { background: rgba(239,68,68,.15);  color: #b91c1c; }
    }

    .status-dot {
      font-size: 12px; font-weight: 500;
      &.active   { color: var(--success); }
      &.inactive { color: var(--text-tertiary); }
    }

    .danger-item { color: var(--danger) !important; mat-icon { color: var(--danger) !important; } }

    .table-empty { text-align: center; padding: var(--space-16); color: var(--text-secondary); mat-icon { font-size: 48px; display: block; margin-bottom: var(--space-3); } }
  `]
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

  loading    = signal(true);
  users      = signal<User[]>([]);
  total      = signal(0);
  currentPage = 0;
  pageSize   = 10;

  displayedColumns = ['user', 'role', 'joined', 'status', 'actions'];
  searchCtrl = new FormControl('');
  roleCtrl   = new FormControl('');

  ngOnInit(): void {
    this.loadUsers();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 0; this.loadUsers(); });
    this.roleCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 0; this.loadUsers(); });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.api.getAdminUsers(this.currentPage, this.pageSize, this.searchCtrl.value || '', this.roleCtrl.value || '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.users.set(data?.content ?? data ?? []);
          this.total.set(data?.totalElements ?? (data?.length ?? 0));
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onPage(ev: PageEvent): void {
    this.currentPage = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.loadUsers();
  }

  changeRole(user: User, role: UserRole): void {
    this.api.updateUserRole(user.id, role).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.users.update(list => list.map(u => u.id === user.id ? { ...u, role } : u))
    });
  }

  toggleActive(user: User): void {
    // Use PATCH to toggle active state
    this.api.updateUserRole(user.id, user.role).pipe(takeUntil(this.destroy$)).subscribe();
  }

  getInitials(u: User): string {
    return (((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase()) || (u.email?.[0]?.toUpperCase() ?? '?');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
