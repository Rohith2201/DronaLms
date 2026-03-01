import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, JwtPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY   = environment.tokenKey;
  private readonly REFRESH_KEY = environment.refreshTokenKey;

  private _currentUser = new BehaviorSubject<User | null>(this.loadUser());
  readonly currentUser$ = this._currentUser.asObservable();

  // Angular Signals (reactive state)
  readonly userSignal   = signal<User | null>(this.loadUser());
  readonly isLoggedIn   = computed(() => !!this.userSignal());
  readonly userRole     = computed(() => this.userSignal()?.role ?? null);
  readonly isStudent    = computed(() => this.userRole() === 'STUDENT');
  readonly isInstructor = computed(() => this.userRole() === 'INSTRUCTOR');
  readonly isAdmin      = computed(() => this.userRole() === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    const [firstName, ...rest] = (req.name ?? '').trim().split(/\s+/);
    const payload = {
      email: req.email,
      password: req.password,
      firstName: req.firstName ?? firstName ?? '',
      lastName: req.lastName ?? (rest.join(' ') || 'User'),
      role: req.role ?? 'STUDENT'
    };

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap(res => this.storeSession(res))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return of({});
    }

    const currentUser = this.getCurrentUser();
    return of({
      accessToken: currentToken,
      tokenType: 'Bearer',
      email: currentUser?.email,
      user: currentUser ?? undefined
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this._currentUser.next(null);
    this.userSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token || !this.isJwtLike(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }
    return token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return (payload.exp * 1000) < Date.now();
    } catch {
      return true;
    }
  }

  getCurrentUser(): User | null {
    return this._currentUser.getValue();
  }

  private storeSession(res: AuthResponse): void {
    const token = res.accessToken ?? res.token;
    if (!token || !this.isJwtLike(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, token);
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    } else {
      localStorage.removeItem(this.REFRESH_KEY);
    }

    const user = this.resolveUser(res, token);
    this._currentUser.next(user);
    this.userSignal.set(user);
  }

  private loadUser(): User | null {
    const token = localStorage.getItem(environment.tokenKey);
    if (!token || !this.isJwtLike(token)) {
      localStorage.removeItem(environment.tokenKey);
      return null;
    }
    try {
      const payload = jwtDecode<JwtPayload & { user?: User; email?: string; roles?: string[] }>(token);
      if ((payload.exp * 1000) < Date.now()) return null;
      if (payload.user) return payload.user;

      const roleRaw = payload.roles?.[0] ?? payload.roles?.[0] ?? 'STUDENT';
      const role = this.normalizeRole(roleRaw);
      const email = payload.email ?? payload.sub;
      const name = email?.split('@')[0] ?? 'User';

      return {
        id: payload.userId ?? payload.sub,
        name,
        email,
        role,
        active: true,
        createdAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  private resolveUser(res: AuthResponse, token: string): User {
    if (res.user) return res.user;

    try {
      const payload = jwtDecode<JwtPayload & { email?: string; roles?: string[] }>(token);
      const roleRaw = res.roles?.[0] ?? payload.roles?.[0] ?? 'STUDENT';
      const role = this.normalizeRole(roleRaw);
      const email = res.email ?? payload.email ?? payload.sub;
      const name = email?.split('@')[0] ?? 'User';

      return {
        id: payload.userId ?? payload.sub,
        name,
        email,
        role,
        active: true,
        createdAt: new Date().toISOString()
      };
    } catch {
      const role = this.normalizeRole(res.roles?.[0] ?? 'STUDENT');
      const email = res.email ?? 'user@drona.local';
      return {
        id: email,
        name: email.split('@')[0],
        email,
        role,
        active: true,
        createdAt: new Date().toISOString()
      };
    }
  }

  private normalizeRole(rawRole: string): 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' {
    const normalized = (rawRole ?? '').replace(/^ROLE_/, '').toUpperCase();
    if (normalized === 'ADMIN' || normalized === 'INSTRUCTOR') return normalized;
    return 'STUDENT';
  }

  private isJwtLike(token: string): boolean {
    return /^[-A-Za-z0-9_=]+\.[-A-Za-z0-9_=]+\.?[-A-Za-z0-9_\-+/=]*$/.test(token);
  }
}
