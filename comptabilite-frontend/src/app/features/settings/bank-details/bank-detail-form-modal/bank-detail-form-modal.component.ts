import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { CompanyService } from '../../company.service'
import { BankDetailItem, CurrencyItem } from '../../../../shared/models/company-profile.model'
const IBAN_PATTERN  = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/
const SWIFT_PATTERN = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/

function ibanOrAccountRequired(group: AbstractControl): ValidationErrors | null {
  const iban   = group.get('iban')?.value?.trim()
  const number = group.get('accountNumber')?.value?.trim()
  return iban || number ? null : { ibanOrAccountRequired: true }
}

@Component({
  selector: 'app-bank-detail-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './bank-detail-form-modal.component.html',
  styleUrl: './bank-detail-form-modal.component.scss'
})
export class BankDetailFormModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create'
  @Input() item: BankDetailItem | null = null
  @Output() saved     = new EventEmitter<BankDetailItem>()
  @Output() cancelled = new EventEmitter<void>()

  private fb             = inject(FormBuilder)
  private companyService = inject(CompanyService)

  saving    = signal(false)
  saveError = signal('')

  currencies = signal<CurrencyItem[]>([])

  form = this.fb.nonNullable.group({
    accountHolder: [''],
    bankName:      ['', Validators.required],
    branch:        [''],
    accountNumber: [''],
    iban:          ['', [Validators.maxLength(34), Validators.pattern(IBAN_PATTERN)]],
    swiftBic:      ['', [Validators.maxLength(11), Validators.pattern(SWIFT_PATTERN)]],
    currency:      ['TND', Validators.required],
    defaultAccount:[false]
  }, { validators: ibanOrAccountRequired })

  ngOnInit(): void {
    this.companyService.getSupportedCurrencies().subscribe({
      next: ({ defaultCurrency, currencies }) => {
        this.currencies.set(currencies)
        if (this.mode === 'create') {
          this.form.patchValue({ currency: defaultCurrency }, { emitEvent: false })
        }
      },
      error: () => {}
    })

    if (this.mode === 'edit' && this.item) {
      this.form.patchValue({
        accountHolder:  this.item.accountHolder ?? '',
        bankName:       this.item.bankName      ?? '',
        branch:         this.item.branch        ?? '',
        accountNumber:  this.item.accountNumber ?? '',
        iban:           this.item.iban          ?? '',
        swiftBic:       this.item.swiftBic      ?? '',
        currency:       this.item.currency,
        defaultAccount: this.item.defaultAccount
      })
    }
  }

  /** True when neither IBAN nor account number is filled and the form has been submitted. */
  crossFieldError(): boolean {
    return !!this.form.errors?.['ibanOrAccountRequired'] && this.form.touched
  }

  /** Returns the first active i18n error key for a control, or null. */
  fieldError(name: string): string | null {
    const ctrl: AbstractControl | null = this.form.get(name)
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null
    if (ctrl.errors['required'])   return 'SETTINGS.BANK_ERR_REQUIRED'
    if (ctrl.errors['maxlength'])  return 'SETTINGS.BANK_ERR_TOO_LONG'
    if (ctrl.errors['pattern']) {
      if (name === 'iban')    return 'SETTINGS.BANK_ERR_IBAN'
      if (name === 'swiftBic') return 'SETTINGS.BANK_ERR_SWIFT'
    }
    return null
  }

  submit(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set('')

    const v = this.form.getRawValue()
    const req = {
      accountHolder:  v.accountHolder  || null,
      bankName:       v.bankName,
      branch:         v.branch         || null,
      accountNumber:  v.accountNumber,
      iban:           v.iban           || null,
      swiftBic:       v.swiftBic       || null,
      currency:       v.currency,
      defaultAccount: v.defaultAccount
    }

    const call$ = this.mode === 'create'
      ? this.companyService.addBankDetail(req)
      : this.companyService.updateBankDetail(this.item!.id, req)

    call$.subscribe({
      next: (item) => { this.saving.set(false); this.saved.emit(item) },
      error: (e) => {
        this.saving.set(false)
        this.saveError.set(e?.error?.message ?? 'SETTINGS.BANK_SAVE_ERROR')
      }
    })
  }

  normalizeIban(event: Event): void {
    const input = event.target as HTMLInputElement
    const ctrl  = this.form.get('iban')!
    ctrl.setValue(input.value.toUpperCase().replace(/ /g, ''), { emitEvent: false })
    input.value = ctrl.value
  }

  normalizeSwift(event: Event): void {
    const input = event.target as HTMLInputElement
    const ctrl  = this.form.get('swiftBic')!
    ctrl.setValue(input.value.toUpperCase(), { emitEvent: false })
    input.value = ctrl.value
  }

  close(): void {
    this.cancelled.emit()
  }
}
