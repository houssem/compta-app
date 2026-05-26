import { Component, signal, computed, OnInit } from '@angular/core'
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { ClientService } from '../client.service'
import {
  CreateClientDto, COUNTRIES, CURRENCIES, PAYMENT_TERMS,
  COUNTRY_CURRENCY_MAP, CLIENT_TYPES, CLIENT_STATUSES
} from '../../../shared/models/client.model'

// ── Custom validators ──────────────────────────────────────────
function optionalUrl(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^https?:\/\/.+\..+/.test(v) ? null : { invalidUrl: true }
}

function optionalPhone(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^[+\d][\d\s\-(). ]{5,}$/.test(v) ? null : { invalidPhone: true }
}

function tunisianTaxId(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').trim()
  if (!v) return null
  return /^\d{7}[A-Z]\/[A-Z]{1,3}\/\d{3}$/.test(v) ? null : { invalidTaxId: true }
}

@Component({
  selector: 'app-new-client',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './new-client.component.html',
  styleUrl: './new-client.component.scss'
})
export class NewClientComponent implements OnInit {

  form!: FormGroup

  // UI state
  editMode      = signal(false)
  loading       = signal(false)
  formSubmitted = signal(false)
  errorMsg      = signal('')

  // Pays sélectionné — mis à jour via valueChanges
  private selectedCountry = signal('Tunisie')
  isTunisian = computed(() => this.selectedCountry() === 'Tunisie')

  // Config (données stables — hardcodées)
  countries           = COUNTRIES
  currencies          = CURRENCIES
  paymentTermsOptions = PAYMENT_TERMS
  clientTypes         = CLIENT_TYPES
  clientStatuses      = CLIENT_STATUSES

  get f() { return this.form.controls }

  get contactsArray(): FormArray {
    return this.form.get('contacts') as FormArray
  }

  private clientId: string | null = null

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      // Légal
      companyName:     ['', Validators.required],
      legalForm:       [''],
      clientType:      ['PROFESSIONNEL'],
      category:        [''],
      rneNumber:       [''],
      matriculeFiscal: [''],
      regimeFiscal:    ['REEL'],
      assujettiTva:    [true],
      website:         ['', optionalUrl],
      status:          ['ACTIVE'],
      // Contacts (FormArray)
      contacts: this.fb.array([this.newContactGroup(true)]),
      // Adresse
      country:         ['Tunisie'],
      streetNumber:    [''],
      streetName:      [''],
      complement:      [''],
      city:            ['', Validators.required],
      postalCode:      ['', Validators.required],
      // Financier
      currency:        ['TND'],
      paymentTerms:    ['Net 30'],
      maxCredit:       [0],
      defaultVatRate:  [19.00],
      discountRate:    [0.00],
      // Notes
      notes:           [''],
    })

    // Réagir au changement de pays
    this.form.get('country')!.valueChanges.subscribe((country: string) => {
      this.selectedCountry.set(country)

      // Auto-devise
      const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
      this.form.patchValue({ currency: suggestedCurrency }, { emitEvent: false })

      // TVA par défaut
      if (country !== 'Tunisie') {
        this.form.patchValue({ defaultVatRate: 0, regimeFiscal: '' }, { emitEvent: false })
      } else {
        this.form.patchValue({ defaultVatRate: 19 }, { emitEvent: false })
      }

      // Validator matricule fiscal
      const ctrl = this.form.get('matriculeFiscal')!
      if (country === 'Tunisie') {
        ctrl.setValidators(tunisianTaxId)
      } else {
        ctrl.clearValidators()
      }
      ctrl.updateValueAndValidity()
    })

    // Activer le validator matricule pour l'état initial (Tunisie)
    this.form.get('matriculeFiscal')!.setValidators(tunisianTaxId)
    this.form.get('matriculeFiscal')!.updateValueAndValidity()

    // Detect edit mode from route param
    this.clientId = this.route.snapshot.paramMap.get('id')
    if (this.clientId) {
      this.editMode.set(true)
      this.clientService.getById(this.clientId).subscribe({
        next: (client) => {
          this.selectedCountry.set(client.billingAddress.country ?? 'Tunisie')
          this.form.patchValue({
            companyName:     client.companyName,
            legalForm:       client.legalForm,
            clientType:      client.clientType,
            category:        client.category,
            rneNumber:       client.rneNumber,
            matriculeFiscal: client.matriculeFiscal,
            regimeFiscal:    client.regimeFiscal,
            assujettiTva:    client.assujettiTva,
            website:         client.website,
            status:          client.status,
            country:         client.billingAddress.country,
            streetNumber:    client.billingAddress.streetNumber,
            streetName:      client.billingAddress.streetName,
            complement:      client.billingAddress.complement,
            city:            client.billingAddress.city,
            postalCode:      client.billingAddress.postalCode,
            currency:        client.financial.currency,
            paymentTerms:    client.financial.paymentTerms,
            maxCredit:       client.financial.maxCredit,
            defaultVatRate:  client.financial.defaultVatRate,
            discountRate:    client.financial.discountRate,
            notes:           client.notes,
          })
          // Patch contacts FormArray
          if (client.contacts?.length) {
            const groups = client.contacts.map(c => {
              const g = this.newContactGroup(c.isPrimary)
              g.patchValue({ fullName: c.fullName, role: c.role, email: c.email, phone: c.phone })
              return g
            })
            this.form.setControl('contacts', this.fb.array(groups))
          }
        },
        error: () => this.router.navigate(['/customers'])
      })
    }
  }

  // ── Contact helpers ─────────────────────────────────────────

  newContactGroup(isPrimary = false): FormGroup {
    return this.fb.group({
      fullName:  ['', Validators.required],
      role:      [''],
      email:     ['', Validators.email],
      phone:     ['', optionalPhone],
      isPrimary: [isPrimary],
    })
  }

  addContact(): void {
    this.contactsArray.push(this.newContactGroup(false))
  }

  removeContact(index: number): void {
    if (this.contactsArray.length === 1) return
    const wasPrimary = this.contactsArray.at(index).get('isPrimary')?.value
    this.contactsArray.removeAt(index)
    if (wasPrimary) {
      this.contactsArray.at(0).get('isPrimary')?.setValue(true)
    }
  }

  setPrimary(index: number): void {
    this.contactsArray.controls.forEach((ctrl, i) => {
      ctrl.get('isPrimary')?.setValue(i === index)
    })
  }

  // ── Save ────────────────────────────────────────────────────

  save(): void {
    this.form.markAllAsTouched()
    this.formSubmitted.set(true)
    if (this.form.invalid) return

    this.loading.set(true)
    this.errorMsg.set('')

    const v = this.form.getRawValue()
    const dto: CreateClientDto = {
      companyName:     v.companyName,
      legalForm:       v.legalForm,
      clientType:      v.clientType,
      category:        v.category,
      notes:           v.notes,
      rneNumber:       this.isTunisian() ? v.rneNumber : '',
      matriculeFiscal: v.matriculeFiscal,
      regimeFiscal:    this.isTunisian() ? v.regimeFiscal : '',
      assujettiTva:    v.assujettiTva,
      website:         v.website,
      contacts: this.contactsArray.getRawValue().map((c: any) => ({
        fullName:  c.fullName,
        role:      c.role,
        email:     c.email,
        phone:     c.phone,
        isPrimary: c.isPrimary,
      })),
      billingAddress: {
        country:      v.country,
        streetNumber: v.streetNumber,
        streetName:   v.streetName,
        complement:   v.complement,
        city:         v.city,
        postalCode:   v.postalCode,
      },
      financial: {
        currency:       v.currency,
        paymentTerms:   v.paymentTerms,
        maxCredit:      v.maxCredit,
        defaultVatRate: v.defaultVatRate,
        discountRate:   v.discountRate,
      },
    }

    const request$ = this.editMode()
      ? this.clientService.update(this.clientId!, dto)
      : this.clientService.create(dto)

    request$.subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/customers']) },
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  cancel(): void {
    this.router.navigate(['/customers'])
  }
}
