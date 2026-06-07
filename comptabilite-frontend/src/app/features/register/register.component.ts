import { Component, signal, computed, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'
import { AuthService } from '../../core/auth/auth.service'
import type { AuthResponse } from '../../core/auth/auth.service'
import { CountryItem } from '../../shared/models/company-profile.model'
import { CompanyService } from '../settings/company.service'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private http       = inject(HttpClient)
  private router     = inject(Router)
  private auth       = inject(AuthService)
  private companySvc = inject(CompanyService)

  currentStep   = signal<1 | 2>(1)
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
  companyName       = signal('')
  matriculeFiscal   = signal('')
  sector            = signal('')
  country      = signal('Tunisie')
  streetNumber = signal('')
  streetName   = signal('')
  complement   = signal('')
  district     = signal('')
  city         = signal('')
  postalCode   = signal('')
  logoFile     = signal<File | null>(null)
  logoFileName = signal('')

  // Submission
  submitting   = signal(false)
  submitError  = signal('')

  countries = signal<CountryItem[]>([])

  ngOnInit(): void {
    this.companySvc.getMasterCountries().subscribe({
      next: (list) => this.countries.set(list),
      error: () => {}
    })
  }

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
  }

  next(): void {
    this.formSubmitted.set(true)
    const step = this.currentStep()
    const valid = step === 1 ? this.step1Valid() : this.step2Valid()
    if (!valid) return
    this.formSubmitted.set(false)
    if (step === 1) {
      this.currentStep.set(2)
    } else {
      this.submit()
    }
  }

  prev(): void {
    if (this.currentStep() === 2) this.currentStep.set(1)
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    this.logoFile.set(file)
    this.logoFileName.set(file.name)
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
    if (this.matriculeFiscal()) fd.append('matriculeFiscal', this.matriculeFiscal())
    if (this.sector())          fd.append('sector',          this.sector())
    fd.append('country', this.country())
    if (this.streetNumber()) fd.append('streetNumber', this.streetNumber())
    if (this.streetName())   fd.append('streetName',   this.streetName())
    if (this.complement())   fd.append('complement',   this.complement())
    if (this.district())     fd.append('district',     this.district())
    if (this.city())         fd.append('city',         this.city())
    if (this.postalCode())   fd.append('postalCode',   this.postalCode())
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
