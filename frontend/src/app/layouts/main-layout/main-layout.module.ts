import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MainLayoutComponent } from './main-layout.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RoleGuard } from '../../core/guards/auth.guard';

// All authenticated pages — role protection applied per child route
const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // ── Student ──────────────────────────────────────────────────────────
      {
        path: 'student/dashboard',
        canActivate: [RoleGuard], data: { roles: ['STUDENT'] },
        loadChildren: () => import('../../pages/student/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'student/courses',
        canActivate: [RoleGuard], data: { roles: ['STUDENT'] },
        loadComponent: () => import('../../pages/student/my-courses/my-courses.component').then(m => m.MyCoursesComponent)
      },
      {
        path: 'student/explore',
        canActivate: [RoleGuard], data: { roles: ['STUDENT'] },
        loadComponent: () => import('../../pages/student/explore-courses/explore-courses.component').then(m => m.ExploreCoursesComponent)
      },
      {
        path: 'student/certificates',
        canActivate: [RoleGuard], data: { roles: ['STUDENT'] },
        loadComponent: () => import('../../pages/student/certificates/certificates.component').then(m => m.CertificatesComponent)
      },
      // Browse courses - accessible to all authenticated users
      {
        path: 'courses',
        loadComponent: () => import('../../pages/student/explore-courses/explore-courses.component').then(m => m.ExploreCoursesComponent)
      },

      // ── Instructor ───────────────────────────────────────────────────────
      {
        path: 'instructor/dashboard',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/instructor-dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent)
      },
      {
        path: 'instructor/courses/create',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/create-course/create-course.component').then(m => m.CreateCourseComponent)
      },
      {
        path: 'instructor/courses',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/manage-courses/manage-courses.component').then(m => m.ManageCoursesComponent)
      },
      {
        path: 'instructor/courses/:id/analytics',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent)
      },
      {
        path: 'instructor/courses/:id/manage',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/manage-content/manage-content.component').then(m => m.ManageContentComponent)
      },
      {
        path: 'instructor/quizzes/:quizId/questions',
        canActivate: [RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] },
        loadComponent: () => import('../../pages/instructor/manage-questions/manage-questions.component').then(m => m.ManageQuestionsComponent)
      },

      // ── Admin ─────────────────────────────────────────────────────────────
      {
        path: 'admin/dashboard',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'admin/users',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/users-management/users-management.component').then(m => m.UsersManagementComponent)
      },
      {
        path: 'admin/courses',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/courses/course-list/course-list.component').then(m => m.CourseListComponent)
      },
      {
        path: 'admin/courses/:courseId/analytics',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/courses/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent)
      },
      {
        path: 'admin/courses/:courseId/enrolled-users',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/courses/enrolled-users/enrolled-users.component').then(m => m.EnrolledUsersComponent)
      },
      {
        path: 'admin/courses/:id/manage',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/admin/courses/manage-content/manage-content.component').then(m => m.ManageContentComponent)
      },
      {
        path: 'admin/quizzes/:quizId/questions',
        canActivate: [RoleGuard], data: { roles: ['ADMIN'] },
        loadComponent: () => import('../../pages/instructor/manage-questions/manage-questions.component').then(m => m.ManageQuestionsComponent)
      },

      // ── Default redirects ──────────────────────────────────────────────────
      { path: 'student',    redirectTo: 'student/dashboard',    pathMatch: 'full' },
      { path: 'instructor', redirectTo: 'instructor/dashboard', pathMatch: 'full' },
      { path: 'admin',      redirectTo: 'admin/dashboard',      pathMatch: 'full' },
    ]
  }
];

@NgModule({
  declarations: [MainLayoutComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    NavbarComponent,
    SidebarComponent,
  ]
})
export class MainLayoutModule {}
