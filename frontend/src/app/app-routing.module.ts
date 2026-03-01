import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/student/dashboard', pathMatch: 'full' },

  // Auth layout (guest only — login/register)
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () => import('./layouts/auth-layout/auth-layout.module')
      .then(m => m.AuthLayoutModule)
  },

  // Main app shell — handles all /student, /instructor, /admin paths
  // Role protection is applied per-child inside MainLayoutModule
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./layouts/main-layout/main-layout.module')
      .then(m => m.MainLayoutModule)
  },

  // Course player (full-screen, no sidebar)
  {
    path: 'learn/:courseId',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/student/course-player/course-player.module')
      .then(m => m.CoursePlayerModule)
  },

  // Error pages
  { path: '403', loadComponent: () => import('./pages/errors/forbidden/forbidden.component').then(m => m.ForbiddenComponent) },
  { path: '404', loadComponent: () => import('./pages/errors/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    paramsInheritanceStrategy: 'always'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
