import { Component, inject, OnInit, signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { CompanyService } from '../company.service'
import { CountryItem } from '../../../shared/models/company-profile.model'
import { forkJoin } from 'rxjs'

@Component({
  selector: 'app-countries',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './countries.component.html',
  styleUrl: './countries.component.scss'
})
export class CountriesComponent implements OnInit {
  private svc = inject(CompanyService)

  loading     = signal(true)
  saving      = signal(false)
  saveError   = signal('')
  saveSuccess = signal(false)

  allCountries   = signal<CountryItem[]>([])
  selectedCodes  = signal<Set<string>>(new Set())

  ngOnInit(): void {
    forkJoin({
      master:  this.svc.getMasterCountries(),
      enabled: this.svc.getSupportedCountries()
    }).subscribe({
      next: ({ master, enabled }) => {
        this.allCountries.set(master)
        const codes = new Set(enabled.countries.map(c => c.isoCode))
        if (codes.size === 0) {
          // Default selection for new companies (fallback)
          codes.add('TN'); codes.add('FR'); codes.add('SA')
        }
        this.selectedCodes.set(codes)
        this.loading.set(false)
      },
      error: () => {
        this.selectedCodes.set(new Set(['TN', 'FR', 'SA']))
        this.loading.set(false)
      }
    })
  }

  isSelected(code: string): boolean { return this.selectedCodes().has(code) }

  getCurrency(code: string): string {
    return this.allCountries().find(c => c.isoCode === code)?.currency ?? 'TND'
  }

  toggle(code: string): void {
    const next = new Set(this.selectedCodes())
    if (next.has(code)) { next.delete(code) } else { next.add(code) }
    this.selectedCodes.set(next)
    this.saveSuccess.set(false)
  }

  save(): void {
    this.saving.set(true)
    this.saveError.set('')
    this.saveSuccess.set(false)

    const codes = [...this.selectedCodes()]
    this.svc.updateSupportedCountries(codes).subscribe({
      next: () => {
        this.saving.set(false)
        this.saveSuccess.set(true)
        setTimeout(() => this.saveSuccess.set(false), 3000)
      },
      error: e => {
        this.saveError.set(e?.error?.message ?? 'Une erreur est survenue.')
        this.saving.set(false)
      }
    })
  }
}
