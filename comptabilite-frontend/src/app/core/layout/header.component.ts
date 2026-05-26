import { Component, computed, inject } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { AuthService } from '../auth/auth.service'
import { LanguageService } from '../i18n/language.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService)
  readonly langService = inject(LanguageService)

  isLoggedIn = computed(() => this.authService.currentUser() !== null)
  userInitial = computed(() => {
    const name = this.authService.currentUser()?.name ?? ''
    return name.charAt(0).toUpperCase() || '?'
  })

  logout(): void {
    this.authService.logout()
  }

  toggleLang(): void {
    this.langService.setLanguage(this.langService.currentLang() === 'en' ? 'fr' : 'en')
  }
}
