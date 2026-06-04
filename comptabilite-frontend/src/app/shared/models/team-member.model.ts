export type UserRole = 'ADMIN' | 'USER' | 'VIEWER'

export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  active: boolean
}
