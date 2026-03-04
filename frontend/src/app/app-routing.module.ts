import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Home page
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    pathMatch: 'full'
  },

  // Public certificate verification
  {
    path: 'verify-certificate',
    loadComponent: () => import('./pages/public/verify-certificate/verify-certificate.component').then(m => m.VerifyCertificateComponent)
  },

  {
    path: 'blogs',
    loadComponent: () => import('./pages/public/blogs/blogs.component').then(m => m.BlogsComponent)
  },

  {
    path: 'sitemap',
    loadComponent: () => import('./pages/public/sitemap/sitemap.component').then(m => m.SitemapComponent)
  },

  // Auth layout (guest only — login/register)
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () => import('./layouts/auth-layout/auth-layout.module')
      .then(m => m.AuthLayoutModule)
  },

  // Course player (full-screen, no sidebar)
  {
    path: 'learn/:courseId',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/student/course-player/course-player.module')
      .then(m => m.CoursePlayerModule)
  },

  // Quiz taking (full-screen) - MUST come before MainLayoutModule catch-all
  {
    path: 'student/quiz/:quizId',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/student/take-quiz/take-quiz.component')
      .then(m => m.TakeQuizComponent)
  },

  // Quiz result
  {
    path: 'student/quiz-result/:quizId',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/student/quiz-result/quiz-result.component')
      .then(m => m.QuizResultComponent)
  },

  // Main app shell — handles all /student, /instructor, /admin paths
  // Role protection is applied per-child inside MainLayoutModule
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./layouts/main-layout/main-layout.module')
      .then(m => m.MainLayoutModule)
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
