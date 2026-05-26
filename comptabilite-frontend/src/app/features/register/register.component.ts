import { Component, signal, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'
import { AuthService } from '../../core/auth/auth.service'
import type { AuthResponse } from '../../core/auth/auth.service'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private http   = inject(HttpClient)
  private router = inject(Router)
  private auth   = inject(AuthService)

  currentStep   = signal<1 | 2 | 3>(1)
  formSubmitted = signal(false)

  // Step 1
  firstName       = signal('')
  lastName        = signal('')
  email           = signal('')
  password        = signal('')
  confirmPassword = signal('')
  showPassword    = signal(false)
  showConfirm     = signal(false)

  // Step 2
  companyName  = signal('')
  vatNumber    = signal('')
  sector       = signal('')
  streetNumber = signal('')
  streetName   = signal('')
  complement   = signal('')
  city         = signal('')
  postalCode   = signal('')
  country      = signal('')
  logoFile     = signal<File | null>(null)
  logoFileName = signal('')

  // Step 3
  accountHolder = signal('')
  bankName      = signal('')
  iban          = signal('')
  swiftBic      = signal('')

  // Submission
  submitting   = signal(false)
  submitError  = signal('')

  readonly countries = [
    'France', 'Tunisie', 'United Kingdom', 'Germany', 'Spain', 'Italy',
    'Belgium', 'Switzerland', 'Netherlands', 'United States', 'Other'
  ]

  step1Valid = computed(() =>
    this.firstName().trim().length > 0 &&
    this.lastName().trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()) &&
    this.password().length >= 8 &&
    this.password() === this.confirmPassword()
  )

  step2Valid = computed(() =>
    this.companyName().trim().length > 0 &&
    this.streetName().trim().length > 0 &&
    this.city().trim().length > 0 &&
    this.postalCode().trim().length > 0 &&
    this.country().trim().length > 0
  )

  step3Valid = computed(() =>
    this.accountHolder().trim().length > 0 &&
    this.bankName().trim().length > 0 &&
    this.iban().trim().length > 0 &&
    this.swiftBic().trim().length > 0
  )

  err = {
    firstName:       computed(() => this.formSubmitted() && !this.firstName().trim()),
    lastName:        computed(() => this.formSubmitted() && !this.lastName().trim()),
    email:           computed(() => this.formSubmitted() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())),
    password:        computed(() => this.formSubmitted() && this.password().length < 8),
    confirmPassword: computed(() => this.formSubmitted() && this.password() !== this.confirmPassword()),
    companyName:     computed(() => this.formSubmitted() && !this.companyName().trim()),
    streetName:      computed(() => this.formSubmitted() && !this.streetName().trim()),
    city:            computed(() => this.formSubmitted() && !this.city().trim()),
    postalCode:      computed(() => this.formSubmitted() && !this.postalCode().trim()),
    country:         computed(() => this.formSubmitted() && !this.country().trim()),
    accountHolder:   computed(() => this.formSubmitted() && !this.accountHolder().trim()),
    bankName:        computed(() => this.formSubmitted() && !this.bankName().trim()),
    iban:            computed(() => this.formSubmitted() && !this.iban().trim()),
    swiftBic:        computed(() => this.formSubmitted() && !this.swiftBic().trim()),
  }

  next(): void {
    this.formSubmitted.set(true)
    const step = this.currentStep()
    const valid = step === 1 ? this.step1Valid() : step === 2 ? this.step2Valid() : this.step3Valid()
    if (!valid) return
    this.formSubmitted.set(false)
    if (step < 3) {
      this.currentStep.set((step + 1) as 2 | 3)
    } else {
      this.submit()
    }
  }

  prev(): void {
    const step = this.currentStep()
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2)
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    this.logoFile.set(file)
    this.logoFileName.set(file.name)
  }

  maskedIban(): string {
    const v = this.iban().replace(/\s/g, '')
    return v.length < 8 ? v : v.slice(0, 4) + ' •••• •••• ' + v.slice(-3)
  }

  private submit(): void {
    this.submitting.set(true)
    this.submitError.set('')

    const fd = new FormData()
    fd.append('firstName',   this.firstName())
    fd.append('lastName',    this.lastName())
    fd.append('email',       this.email())
    fd.append('password',    this.password())
    fd.append('companyName', this.companyName())
    if (this.vatNumber())    fd.append('vatNumber',    this.vatNumber())
    if (this.sector())       fd.append('sector',       this.sector())
    if (this.streetNumber()) fd.append('streetNumber', this.streetNumber())
    if (this.streetName())   fd.append('streetName',   this.streetName())
    if (this.complement())   fd.append('complement',   this.complement())
    if (this.city())         fd.append('city',         this.city())
    if (this.postalCode())   fd.append('postalCode',   this.postalCode())
    if (this.country())      fd.append('country',      this.country())
    if (this.accountHolder()) fd.append('accountHolder', this.accountHolder())
    if (this.bankName())      fd.append('bankName',      this.bankName())
    if (this.iban())          fd.append('iban',          this.iban())
    if (this.swiftBic())      fd.append('swiftBic',      this.swiftBic())
    const logo = this.logoFile()
    if (logo) fd.append('logo', logo)

    this.http.post<AuthResponse>('/api/auth/register', fd).subscribe({
      next: res => {
        this.auth.setSession(res)
        this.submitting.set(false)
        this.router.navigate(['/dashboard-vente'])
      },
      error: e => {
        this.submitError.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.submitting.set(false)
      }
    })
  }
}
