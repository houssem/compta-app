import { Injectable, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { Observable, map, tap } from 'rxjs'
import { User } from '../../shared/models/kpi.model'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    companyId: string
    companyName: string
  }
}

const TOKEN_KEY   = 'token'
const REFRESH_KEY = 'refreshToken'
const USER_KEY    = 'user'

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null)
  private http   = inject(HttpClient)
  private router = inject(Router)

  constructor() {
    this._restoreSession()
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      map(res => { this.setSession(res) })
    )
  }

  setSession(res: AuthResponse): void {
    const user: User = {
      id:    res.user.id,
      email: res.user.email,
      name:  `${res.user.firstName} ${res.user.lastName}`,
      role:  res.user.role
    }
    localStorage.setItem(TOKEN_KEY,   res.accessToken)
    localStorage.setItem(REFRESH_KEY, res.refreshToken)
    localStorage.setItem(USER_KEY,    JSON.stringify(user))
    this.currentUser.set(user)
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    this.currentUser.set(null)
    this.router.navigate(['/login'])
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  }

  refresh(): Observable<void> {
    const refreshToken = this.getRefreshToken()
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => this.setSession(res)),
      map(() => void 0)
    )
  }

  private _restoreSession(): void {
    const stored = localStorage.getItem(USER_KEY)
    const token  = localStorage.getItem(TOKEN_KEY)
    if (stored && token) {
      try {
        this.currentUser.set(JSON.parse(stored) as User)
      } catch {
        this.logout()
      }
    }
  }
}
