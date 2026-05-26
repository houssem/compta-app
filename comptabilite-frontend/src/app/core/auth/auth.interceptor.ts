import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, switchMap, throwError } from 'rxjs'
import { AuthService } from './auth.service'

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService)

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/api/auth/')) {
        return authService.refresh().pipe(
          switchMap(() => {
            const token = authService.getToken()
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            return next(retried)
          }),
          catchError(refreshErr => {
            authService.logout()
            return throwError(() => refreshErr)
          })
        )
      }
      return throwError(() => err)
    })
  )
}
