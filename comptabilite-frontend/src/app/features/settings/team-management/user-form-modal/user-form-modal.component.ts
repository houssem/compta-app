// src/app/features/settings/team-management/user-form-modal/user-form-modal.component.ts
import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { switchMap, map, of } from 'rxjs'
import { UserAdminService } from '../../user-admin.service'
import { TeamMember, CreateUserRequest, UpdateUserRequest, UserRole, ChangePasswordRequest } from '../../../../shared/models/team-member.model'

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

  changePasswordOpen = signal(false)

  passwordForm = this.fb.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: this.passwordsMatch.bind(this) }
  )

  private passwordsMatch(g: AbstractControl) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true }
  }

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
    if (this.form.invalid) return
    if (this.changePasswordOpen() && this.passwordForm.invalid) return

    this.saving.set(true)

    const profile$ = this.mode === 'create'
      ? this.userAdminService.create(this.form.value as CreateUserRequest)
      : this.userAdminService.update(this.member!.id, this.form.value as UpdateUserRequest)

    profile$.pipe(
      switchMap(saved => {
        if (this.mode === 'edit' && this.changePasswordOpen()) {
          const { newPassword } = this.passwordForm.value
          return this.userAdminService.changePassword(this.member!.id, { newPassword: newPassword! })
            .pipe(map(() => saved))
        }
        return of(saved)
      })
    ).subscribe({
      next: (saved) => { this.saving.set(false); this.saved.emit(saved) },
      error: (err) => {
        this.saving.set(false)
        if (err.status === 409) this.form.get('email')?.setErrors({ taken: true })
      }
    })
  }

  close(): void {
    this.cancelled.emit()
  }
}
