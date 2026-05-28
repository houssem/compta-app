// src/app/features/suppliers/new-supplier/new-supplier.component.ts
import { Component, signal, computed, OnInit } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms'
import { RouterLink, Router, ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { SupplierService } from '../supplier.service'
import { CreateSupplierDto, SUPPLIER_CATEGORIES, WITHHOLDING_TAX_TYPES } from '../../../shared/models/supplier.model'
import { COUNTRIES, CURRENCIES, PAYMENT_TERMS, COUNTRY_CURRENCY_MAP } from '../../../shared/models/client.model'

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

@Component({
  selector: 'app-new-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './new-supplier.component.html',
  styleUrl: './new-supplier.component.scss'
})
export class NewSupplierComponent implements OnInit {

  form!: FormGroup
  readonly categories        = SUPPLIER_CATEGORIES
  readonly countries         = COUNTRIES
  readonly currencies        = CURRENCIES
  readonly paymentTerms      = PAYMENT_TERMS
  readonly withholdingTypes  = WITHHOLDING_TAX_TYPES

  editMode      = signal(false)
  loading       = signal(false)
  formSubmitted = signal(false)
  errorMsg      = signal('')

  private selectedCountry = signal('Tunisie')
  isTunisian = computed(() => this.selectedCountry() === 'Tunisie')

  get f() { return this.form.controls }

  get contactsArray(): FormArray {
    return this.form.get('contacts') as FormArray
  }

  private supplierId: string | null = null

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      companyName:         ['', Validators.required],
      website:             ['', optionalUrl],
      category:            ['', Validators.required],
      rneNumber:           [''],
      taxId:               [''],
      regimeFiscal:        ['REEL'],
      assujettiTva:        [true],
      contacts:            this.fb.array([this.newContactGroup(true)]),
      street:              [''],
      city:                [''],
      postalCode:          [''],
      country:             ['Tunisie'],
      currency:            ['TND'],
      paymentTerms:        ['Net 30'],
      defaultAccount:      ['401000'],
      withholdingTaxType:  [''],
      withholdingTaxRate:  [{ value: null, disabled: true }],
      bankName:            [''],
      iban:                [''],
      swiftBic:            [''],
    })

    this.form.get('country')!.valueChanges.subscribe((country: string) => {
      this.selectedCountry.set(country)
      const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] ?? 'TND'
      this.form.patchValue({ currency: suggestedCurrency }, { emitEvent: false })
      if (country !== 'Tunisie') {
        this.form.patchValue({ regimeFiscal: '' }, { emitEvent: false })
      } else {
        this.form.patchValue({ regimeFiscal: 'REEL' }, { emitEvent: false })
      }
    })

    this.form.get('withholdingTaxType')!.valueChanges.subscribe((type: string) => {
      const match = this.withholdingTypes.find(t => t.value === type)
      const rateCtrl = this.form.get('withholdingTaxRate')!
      if (match?.rate != null) {
        rateCtrl.enable({ emitEvent: false })
        rateCtrl.setValue(match.rate, { emitEvent: false })
      } else if (type === 'ETRANGER') {
        rateCtrl.enable({ emitEvent: false })
        rateCtrl.setValue(null, { emitEvent: false })
      } else {
        rateCtrl.disable({ emitEvent: false })
        rateCtrl.setValue(null, { emitEvent: false })
      }
    })

    this.supplierId = this.route.snapshot.paramMap.get('id')
    if (this.supplierId) {
      this.editMode.set(true)
      this.supplierService.getById(this.supplierId).subscribe({
        next: (supplier) => {
          this.selectedCountry.set(supplier.address.country ?? 'Tunisie')
          this.form.patchValue({
            companyName:        supplier.companyName,
            website:            supplier.website,
            category:           supplier.category,
            rneNumber:          supplier.rneNumber ?? '',
            taxId:              supplier.financial.taxId,
            regimeFiscal:       supplier.regimeFiscal ?? 'REEL',
            assujettiTva:       supplier.assujettiTva ?? true,
            street:             supplier.address.street,
            city:               supplier.address.city,
            postalCode:         supplier.address.postalCode,
            country:            supplier.address.country,
            currency:           supplier.financial.currency,
            paymentTerms:       supplier.financial.paymentTerms,
            defaultAccount:     supplier.financial.defaultAccount ?? '401000',
            withholdingTaxType: supplier.financial.withholdingTaxType ?? '',
            withholdingTaxRate: supplier.financial.withholdingTaxRate ?? null,
            bankName:           supplier.bank?.bankName ?? '',
            iban:               supplier.bank?.iban ?? '',
            swiftBic:           supplier.bank?.swiftBic ?? '',
          })
          if (supplier.financial.withholdingTaxType) {
            this.form.get('withholdingTaxRate')!.enable({ emitEvent: false })
          }
          if (supplier.contacts?.length) {
            const groups = supplier.contacts.map(c => {
              const g = this.newContactGroup(c.isPrimary)
              g.patchValue({ fullName: c.fullName, role: c.role, email: c.email, phone: c.phone })
              return g
            })
            this.form.setControl('contacts', this.fb.array(groups))
          }
        },
        error: () => this.router.navigate(['/suppliers'])
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

  withholdingLabel(type: string): string {
    return this.withholdingTypes.find(t => t.value === type)?.label ?? type
  }

  // ── Save ────────────────────────────────────────────────────

  save(): void {
    this.form.markAllAsTouched()
    this.formSubmitted.set(true)
    if (this.form.invalid) return

    this.loading.set(true)
    this.errorMsg.set('')

    const v = this.form.getRawValue()
    const dto: CreateSupplierDto = {
      companyName: v.companyName,
      website:     v.website,
      category:    v.category,
      contacts:    this.contactsArray.getRawValue().map((c: any) => ({
        fullName:  c.fullName,
        role:      c.role,
        email:     c.email,
        phone:     c.phone,
        isPrimary: c.isPrimary,
      })),
      address: {
        street:     v.street,
        city:       v.city,
        postalCode: v.postalCode,
        country:    v.country,
      },
      financial: {
        taxId:              v.taxId,
        currency:           v.currency,
        paymentTerms:       v.paymentTerms,
        defaultAccount:     v.defaultAccount,
        withholdingTaxType: v.withholdingTaxType,
        withholdingTaxRate: v.withholdingTaxRate,
      },
      bank: {
        bankName: v.bankName,
        iban:     v.iban,
        swiftBic: v.swiftBic,
      },
    }

    const request$ = this.editMode()
      ? this.supplierService.update(this.supplierId!, dto)
      : this.supplierService.create(dto)

    request$.subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/suppliers']) },
      error: (e) => {
        this.errorMsg.set(e?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
        this.loading.set(false)
      }
    })
  }

  cancel(): void {
    this.router.navigate(['/suppliers'])
  }
}
