import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LmsStateStore } from '../state-management/lms-state.store';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private store: LmsStateStore, private toastr: ToastrService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests++;
    if (this.activeRequests === 1) this.store.setLoading(true);

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message || err.message || 'An error occurred';
        if (err.status >= 500) {
          this.toastr.error(message, 'Server Error');
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) this.store.setLoading(false);
      })
    );
  }
}
