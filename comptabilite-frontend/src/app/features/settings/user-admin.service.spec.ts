import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { UserAdminService } from './user-admin.service'
import { TeamMember, CreateUserRequest, UpdateUserRequest } from '../../shared/models/team-member.model'

const MOCK_MEMBER: TeamMember = {
  id: 'uuid-1', firstName: 'Ahmed', lastName: 'Hamdi',
  email: 'ahmed@test.tn', role: 'ADMIN', active: true,
  createdAt: '2025-01-15T10:00:00Z'
}

describe('UserAdminService', () => {
  let service: UserAdminService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(UserAdminService)
    http    = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should be created', () => expect(service).toBeTruthy())

  it('getAll() calls GET /api/users', () => {
    let result: TeamMember[] | undefined
    service.getAll().subscribe(r => (result = r))
    const req = http.expectOne('/api/users')
    expect(req.request.method).toBe('GET')
    req.flush([MOCK_MEMBER])
    expect(result?.length).toBe(1)
  })

  it('create() calls POST /api/users', () => {
    const payload: CreateUserRequest = {
      firstName: 'Sonia', lastName: 'Ben Amor',
      email: 'sonia@test.tn', password: 'secret123', role: 'USER'
    }
    let result: TeamMember | undefined
    service.create(payload).subscribe(r => (result = r))
    const req = http.expectOne('/api/users')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush({ ...MOCK_MEMBER, ...payload })
    expect(result?.email).toBe('sonia@test.tn')
  })

  it('update() calls PUT /api/users/:id', () => {
    const payload: UpdateUserRequest = {
      firstName: 'Ahmed', lastName: 'Hamdi',
      email: 'ahmed@test.tn', role: 'USER', active: false
    }
    service.update('uuid-1', payload).subscribe()
    const req = http.expectOne('/api/users/uuid-1')
    expect(req.request.method).toBe('PUT')
    req.flush({ ...MOCK_MEMBER, ...payload })
  })

  it('delete() calls DELETE /api/users/:id', () => {
    service.delete('uuid-1').subscribe()
    const req = http.expectOne('/api/users/uuid-1')
    expect(req.request.method).toBe('DELETE')
    req.flush(null)
  })
})
