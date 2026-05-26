import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { Component } from '@angular/core'
import { AuthService } from './auth.service'

@Component({ template: '', standalone: true })
class StubComponent {}


const MOCK_REGISTRATION = {
  id: 1,
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  status: 'pending'
}

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([
        { path: 'login', component: StubComponent },
        { path: 'dashboard', component: StubComponent }
      ]), HttpClientTestingModule],
      providers: [AuthService]
    })
    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('currentUser signal is null on init with no stored user', () => {
    expect(service.currentUser()).toBeNull()
  })

  it('login() with correct credentials stores user and updates signal', fakeAsync(() => {
    let completed = false
    service.login('test@example.com', 'password123').subscribe(() => { completed = true })
    const req = httpMock.expectOne(r => r.url.includes('/api/registrations'))
    req.flush([MOCK_REGISTRATION])
    tick()
    expect(completed).toBeTrue()
    expect(localStorage.getItem('user')).not.toBeNull()
    expect(service.currentUser()?.email).toBe('test@example.com')
  }))

  it('login() with wrong password emits error', fakeAsync(() => {
    let errored = false
    service.login('test@example.com', 'wrongpass').subscribe({ error: () => { errored = true } })
    const req = httpMock.expectOne(r => r.url.includes('/api/registrations'))
    req.flush([MOCK_REGISTRATION])
    tick()
    expect(errored).toBeTrue()
    expect(service.currentUser()).toBeNull()
  }))

  it('login() with unknown email emits error', fakeAsync(() => {
    let errored = false
    service.login('unknown@example.com', 'password123').subscribe({ error: () => { errored = true } })
    const req = httpMock.expectOne(r => r.url.includes('/api/registrations'))
    req.flush([])
    tick()
    expect(errored).toBeTrue()
    expect(service.currentUser()).toBeNull()
  }))

  it('logout() removes user from localStorage and sets signal to null', fakeAsync(() => {
    service.login('test@example.com', 'password123').subscribe()
    const req = httpMock.expectOne(r => r.url.includes('/api/registrations'))
    req.flush([MOCK_REGISTRATION])
    tick()
    service.logout()
    expect(localStorage.getItem('user')).toBeNull()
    expect(service.currentUser()).toBeNull()
  }))

  it('_restoreSession() loads user from localStorage on init', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' }
    localStorage.setItem('user', JSON.stringify(user))
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([
        { path: 'login', component: StubComponent },
        { path: 'dashboard', component: StubComponent }
      ]), HttpClientTestingModule],
      providers: [AuthService]
    })
    const fresh = TestBed.inject(AuthService)
    expect(fresh.currentUser()?.email).toBe('test@example.com')
  })
})
