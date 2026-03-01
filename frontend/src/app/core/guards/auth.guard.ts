import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.isLoggedIn() && !this.auth.isTokenExpired()) {
      return true;
    }
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles: string[] = route.data['roles'] ?? [];
    const userRole = this.auth.userRole();

    if (!requiredRoles.length || (userRole && requiredRoles.includes(userRole))) {
      return true;
    }
    this.router.navigate(['/403']);
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) return true;
    const role = this.auth.userRole();
    if (role === 'INSTRUCTOR') this.router.navigate(['/instructor']);
    else if (role === 'ADMIN') this.router.navigate(['/admin']);
    else this.router.navigate(['/student']);
    return false;
  }
}
