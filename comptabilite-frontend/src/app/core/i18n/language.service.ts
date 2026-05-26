import { Injectable, signal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

type Lang = 'en' | 'fr'

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly currentLang = signal<Lang>('fr')

  constructor(private translate: TranslateService) {
    const lang = this._resolveInitialLang()
    this.currentLang.set(lang)
    this.translate.setDefaultLang('fr')
    this.translate.use(lang)
  }

  setLanguage(lang: Lang): void {
    this.currentLang.set(lang)
    localStorage.setItem('lang', lang)
    this.translate.use(lang)
  }

  /** Exposed for testing. Accepts optional browserLang override. */
  _resolveInitialLang(browserLang?: string): Lang {
    const stored = localStorage.getItem('lang')
    if (stored === 'en' || stored === 'fr') return stored
    const nav = (browserLang ?? navigator.language ?? '').toLowerCase()
    if (nav.startsWith('en')) return 'en'
    if (nav.startsWith('fr')) return 'fr'
    return 'fr'
  }
}
