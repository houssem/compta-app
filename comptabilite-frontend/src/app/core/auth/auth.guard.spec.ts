import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { signal } from '@angular/core'
import { AuthService } from './auth.service'
import { authGuard } from './auth.guard'
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let router: Router

  beforeEach(() => {
    const currentUserSignal = signal<any>(null)
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: currentUserSignal
    })
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    })
    router = TestBed.inject(Router)
  })

  it('returns true when user is present', () => {
    (authServiceSpy.currentUser as any).set({ id: '1', name: 'Test' })
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    )
    expect(result).toBeTrue()
  })

  it('returns UrlTree to /login when user is null', () => {
    (authServiceSpy.currentUser as any).set(null)
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    )
    expect(result).toEqual(router.createUrlTree(['/login']))
  })
})
