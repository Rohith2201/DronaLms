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
  private readonly USER_KEY    = 'drona_user';

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
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.next(null);
    this.userSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
    if (!token || !this.isJwtLike(token)) {
      sessionStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }
    return token;
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_KEY) || localStorage.getItem(this.REFRESH_KEY);
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
      sessionStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      return;
    }

    sessionStorage.setItem(this.TOKEN_KEY, token);
    localStorage.removeItem(this.TOKEN_KEY);
    if (res.refreshToken) {
      sessionStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      localStorage.removeItem(this.REFRESH_KEY);
    } else {
      sessionStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
    }

    const user = this.resolveUser(res, token);
    console.log('[AuthService] storeSession - resolved user:', user);
    
    // Store user object in sessionStorage
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.removeItem(this.USER_KEY);
    
    this._currentUser.next(user);
    this.userSignal.set(user);
  }

  private loadUser(): User | null {
    // First try to get stored user object
    const storedUser = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        console.log('[AuthService] loadUser - from storage:', user);
        return user;
      } catch (err) {
        console.error('[AuthService] loadUser - failed to parse stored user:', err);
        sessionStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    
    // Fall back to reconstructing from JWT token
    const token = sessionStorage.getItem(environment.tokenKey) || localStorage.getItem(environment.tokenKey);
    if (!token || !this.isJwtLike(token)) {
      sessionStorage.removeItem(environment.tokenKey);
      localStorage.removeItem(environment.tokenKey);
      return null;
    }
    try {
      const payload = jwtDecode<JwtPayload & { user?: User; email?: string; roles?: string[] }>(token);
      if ((payload.exp * 1000) < Date.now()) return null;
      if (payload.user) return payload.user;

      const role = this.resolvePrimaryRole(payload.roles, 'STUDENT');
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
    console.log('[AuthService] resolveUser - input:', { res, hasToken: !!token });
    
    if (res.user) {
      const normalizedRole = this.normalizeRole((res.user as any).role);
      console.log('[AuthService] resolveUser - from res.user, role:', (res.user as any).role, '→', normalizedRole);
      return {
        ...res.user,
        role: normalizedRole
      };
    }

    try {
      const payload = jwtDecode<JwtPayload & { email?: string; roles?: string[] }>(token);
      const combinedRoles = [
        ...(res.roles ?? []),
        ...(payload.roles ?? [])
      ];
      console.log('[AuthService] resolveUser - combinedRoles:', combinedRoles);
      const role = this.resolvePrimaryRole(combinedRoles, 'STUDENT');
      const email = res.email ?? payload.email ?? payload.sub;
      const name = email?.split('@')[0] ?? 'User';

      console.log('[AuthService] resolveUser - resolved role:', role);
      return {
        id: payload.userId ?? payload.sub,
        name,
        email,
        role,
        active: true,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('[AuthService] resolveUser - JWT decode error:', err);
      const role = this.resolvePrimaryRole(res.roles, 'STUDENT');
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

  private resolvePrimaryRole(roles?: string[] | null, fallback: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = 'STUDENT'): 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' {
    const normalizedRoles = (roles ?? []).map(role => this.normalizeRole(role));
    console.log('[AuthService] resolvePrimaryRole - input roles:', roles, '→ normalized:', normalizedRoles);
    if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
    if (normalizedRoles.includes('INSTRUCTOR')) return 'INSTRUCTOR';
    if (normalizedRoles.includes('STUDENT')) return 'STUDENT';
    return fallback;
  }

  private isJwtLike(token: string): boolean {
    return /^[-A-Za-z0-9_=]+\.[-A-Za-z0-9_=]+\.?[-A-Za-z0-9_\-+/=]*$/.test(token);
  }
}
