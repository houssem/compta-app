import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { TeamMember, CreateUserRequest, UpdateUserRequest } from '../../shared/models/team-member.model'

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private http = inject(HttpClient)

  getAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>('/api/users')
  }

  create(req: CreateUserRequest): Observable<TeamMember> {
    return this.http.post<TeamMember>('/api/users', req)
  }

  update(id: string, req: UpdateUserRequest): Observable<TeamMember> {
    return this.http.put<TeamMember>(`/api/users/${id}`, req)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`)
  }
}
