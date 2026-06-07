import { Component, inject, OnInit, signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { CompanyService } from '../company.service'
import { CurrencyItem } from '../../../shared/models/company-profile.model'
import { forkJoin } from 'rxjs'

@Component({
  selector: 'app-currencies',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './currencies.component.html',
  styleUrl: './currencies.component.scss'
})
export class CurrenciesComponent implements OnInit {
  private svc = inject(CompanyService)

  loading  = signal(true)
  saving   = signal(false)

  masterList      = signal<CurrencyItem[]>([])
  selectedCodes   = signal<Set<string>>(new Set())
  defaultCurrency = signal('TND')

  saveError   = signal('')
  saveSuccess = signal(false)

  isSelected = (code: string): boolean => this.selectedCodes().has(code)

  ngOnInit(): void {
    forkJoin({
      master:  this.svc.getMasterCurrencies(),
      enabled: this.svc.getSupportedCurrencies()
    }).subscribe({
      next: ({ master, enabled }) => {
        this.masterList.set(master)
        this.defaultCurrency.set(enabled.defaultCurrency)
        const codes = new Set(enabled.currencies.map(c => c.isoCode))
        if (codes.size === 0) codes.add(enabled.defaultCurrency)
        this.selectedCodes.set(codes)
        this.loading.set(false)
      },
      error: () => {
        this.selectedCodes.set(new Set(['TND']))
        this.loading.set(false)
      }
    })
  }

  toggle(code: string): void {
    if (code === this.defaultCurrency()) return
    const next = new Set(this.selectedCodes())
    if (next.has(code)) { next.delete(code) } else { next.add(code) }
    this.selectedCodes.set(next)
    this.saveSuccess.set(false)
  }

  save(): void {
    this.saving.set(true)
    this.saveError.set('')
    this.saveSuccess.set(false)
    this.svc.updateSupportedCurrencies([...this.selectedCodes()]).subscribe({
      next: () => { this.saving.set(false); this.saveSuccess.set(true) },
      error: e => { this.saveError.set(e?.error?.message ?? 'Une erreur est survenue.'); this.saving.set(false) }
    })
  }
}
