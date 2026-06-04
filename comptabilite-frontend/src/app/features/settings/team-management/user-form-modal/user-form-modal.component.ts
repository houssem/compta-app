// src/app/features/settings/team-management/user-form-modal/user-form-modal.component.ts
import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { UserAdminService } from '../../user-admin.service'
import { TeamMember, CreateUserRequest, UpdateUserRequest, UserRole } from '../../../../shared/models/team-member.model'

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss'
})
export class UserFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create'
  @Input() member: TeamMember | null = null
  @Output() saved     = new EventEmitter<TeamMember>()
  @Output() cancelled = new EventEmitter<void>()

  private fb               = inject(FormBuilder)
  private userAdminService = inject(UserAdminService)

  saving    = signal(false)
  saveError = signal('')

  readonly roles: UserRole[] = ['ADMIN', 'USER', 'VIEWER']

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', Validators.required],
    role:      ['USER' as UserRole, Validators.required],
    active:    [true]
  })

  ngOnInit(): void {
    if (this.mode === 'edit' && this.member) {
      this.form.patchValue({
        firstName: this.member.firstName,
        lastName:  this.member.lastName,
        email:     this.member.email,
        role:      this.member.role,
        active:    this.member.active
      })
      // Password not required for edit
      this.form.get('password')!.clearValidators()
      this.form.get('password')!.updateValueAndValidity()
    }
  }

  submit(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set('')

    const v = this.form.getRawValue()

    if (this.mode === 'create') {
      const req: CreateUserRequest = {
        firstName: v.firstName,
        lastName:  v.lastName,
        email:     v.email,
        password:  v.password,
        role:      v.role
      }
      this.userAdminService.create(req).subscribe({
        next: (member) => { this.saving.set(false); this.saved.emit(member) },
        error: (e) => {
          this.saving.set(false)
          this.saveError.set(
            e?.status === 409
              ? 'SETTINGS.ERROR_EMAIL_TAKEN'
              : (e?.error?.message ?? 'Une erreur est survenue.')
          )
        }
      })
    } else {
      const req: UpdateUserRequest = {
        firstName: v.firstName,
        lastName:  v.lastName,
        email:     v.email,
        role:      v.role,
        active:    v.active
      }
      this.userAdminService.update(this.member!.id, req).subscribe({
        next: (member) => { this.saving.set(false); this.saved.emit(member) },
        error: (e) => {
          this.saving.set(false)
          this.saveError.set(
            e?.status === 409
              ? 'SETTINGS.ERROR_EMAIL_TAKEN'
              : (e?.error?.message ?? 'Une erreur est survenue.')
          )
        }
      })
    }
  }

  close(): void {
    this.cancelled.emit()
  }
}
