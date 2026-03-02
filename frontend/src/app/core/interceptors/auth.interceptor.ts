import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthResponse } from '../models';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    const token = this.auth.getToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        if (err.status === 403) {
          this.router.navigate(['/403']);
        }
        return throwError(() => err);
      })
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshToken$.pipe(
        filter(Boolean),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshToken$.next(null);

    return this.auth.refreshToken().pipe(
      switchMap((res: AuthResponse) => {
        const token = res.accessToken ?? res.token;
        this.isRefreshing = false;
        if (!token) {
          this.auth.logout();
          return throwError(() => new Error('Refresh token response did not contain access token'));
        }
        this.refreshToken$.next(token);
        return next.handle(this.addToken(req, token));
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.auth.logout();
        return throwError(() => err);
      })
    );
  }
}
