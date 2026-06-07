// src/app/features/settings/company-profile/company-profile.component.ts
import { Component, inject, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { CompanyService } from '../company.service'
import { CompanyProfile, UpdateCompanyRequest } from '../../../shared/models/company-profile.model'

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss'
})
export class CompanyProfileComponent implements OnInit {
  private fb               = inject(FormBuilder)
  private companyService   = inject(CompanyService)
  private translateService = inject(TranslateService)

  loading     = signal(true)
  saving      = signal(false)
  saveError   = signal('')
  saveSuccess = signal(false)

  currentLogoUrl  = signal<string | null>(null)
  newLogoFile     = signal<File | null>(null)
  newLogoPreview  = signal<string | null>(null)

  private lastLoaded: CompanyProfile | null = null

  form = this.fb.nonNullable.group({
    name:             ['', Validators.required],
    legalForm:        [''],
    regimeFiscal:     ['REEL'],
    assujettiTva:     [true],
    website:          [''],
    matriculeFiscal:  [''],
    rneNumber:        [''],
    sector:           [''],
    streetNumber:     [''],
    streetName:       [''],
    complement:       [''],
    district:         [''],
    city:             ['', Validators.required],
    postalCode:       [''],
    country:          ['Tunisie'],
    phone:            [''],
    email:            ['', Validators.email],
    currency:         ['TND'],
    notes:            ['']
  })

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (c) => {
        this.lastLoaded = c
        this.patchFormFromProfile(c)
        this.currentLogoUrl.set(c.logoPath)
        this.loading.set(false)
      },
      error: () => this.loading.set(false)
    })
  }

  private patchFormFromProfile(c: CompanyProfile): void {
    this.form.patchValue({
      name:            c.name            ?? '',
      legalForm:       c.legalForm       ?? '',
      regimeFiscal:    c.regimeFiscal    ?? 'REEL',
      assujettiTva:    c.assujettiTva    ?? true,
      website:         c.website         ?? '',
      matriculeFiscal: c.matriculeFiscal ?? '',
      rneNumber:       c.rneNumber       ?? '',
      sector:          c.sector          ?? '',
      streetNumber:    c.streetNumber    ?? '',
      streetName:      c.streetName      ?? '',
      complement:      c.complement      ?? '',
      district:        c.district        ?? '',
      city:            c.city            ?? '',
      postalCode:      c.postalCode      ?? '',
      country:         c.country         ?? 'Tunisie',
      phone:           c.phone           ?? '',
      email:           c.email           ?? '',
      currency:        c.currency        ?? 'TND',
      notes:           c.notes           ?? ''
    })
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.saveError.set(this.translateService.instant('SETTINGS.ERROR_LOGO_FORMAT'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      this.saveError.set(this.translateService.instant('SETTINGS.ERROR_LOGO_SIZE'))
      return
    }

    this.saveError.set('')
    this.newLogoFile.set(file)
    const reader = new FileReader()
    reader.onload = () => this.newLogoPreview.set(reader.result as string)
    reader.readAsDataURL(file)
  }

  save(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set('')
    this.saveSuccess.set(false)

    const req: UpdateCompanyRequest = this.form.getRawValue()

    this.companyService.updateMyCompany(req, this.newLogoFile() ?? undefined).subscribe({
      next: (updated) => {
        this.saving.set(false)
        this.saveSuccess.set(true)
        this.currentLogoUrl.set(updated.logoPath)
        this.newLogoFile.set(null)
        this.newLogoPreview.set(null)
        setTimeout(() => this.saveSuccess.set(false), 3000)
      },
      error: (e) => {
        this.saving.set(false)
        this.saveError.set(e?.error?.message ?? 'Une erreur est survenue.')
      }
    })
  }

  cancel(): void {
    this.newLogoFile.set(null)
    this.newLogoPreview.set(null)
    this.saveError.set('')
    if (this.lastLoaded) {
      this.patchFormFromProfile(this.lastLoaded)
      this.currentLogoUrl.set(this.lastLoaded.logoPath)
    }
    this.form.markAsPristine()
    this.form.markAsUntouched()
  }

  logoDisplayUrl(): string | null {
    return this.newLogoPreview() ?? this.currentLogoUrl()
  }
}
