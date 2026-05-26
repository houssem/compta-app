import { TestBed } from '@angular/core/testing'
import { TranslateService } from '@ngx-translate/core'
import { LanguageService } from './language.service'

describe('LanguageService', () => {
  let service: LanguageService
  let translateSpy: jasmine.SpyObj<TranslateService>

  beforeEach(() => {
    localStorage.clear()
    translateSpy = jasmine.createSpyObj('TranslateService', ['use', 'setDefaultLang'], {
      onLangChange: { subscribe: () => {} }
    })
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateSpy }
      ]
    })
    service = TestBed.inject(LanguageService)
  })

  it('uses stored lang from localStorage', () => {
    localStorage.setItem('lang', 'en')
    const lang = service['_resolveInitialLang']()
    expect(lang).toBe('en')
  })

  it('falls back to fr for unrecognized browser language', () => {
    const lang = service['_resolveInitialLang']('de-DE')
    expect(lang).toBe('fr')
  })

  it('maps en-US to en', () => {
    const lang = service['_resolveInitialLang']('en-US')
    expect(lang).toBe('en')
  })

  it('maps fr-FR to fr', () => {
    const lang = service['_resolveInitialLang']('fr-FR')
    expect(lang).toBe('fr')
  })

  it('setLanguage updates currentLang signal and persists to localStorage', () => {
    service.setLanguage('en')
    expect(service.currentLang()).toBe('en')
    expect(localStorage.getItem('lang')).toBe('en')
    expect(translateSpy.use).toHaveBeenCalledWith('en')
  })
})
