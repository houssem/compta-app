import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = ''
  password = ''
  errorMessage = ''
  loading = false
  showPassword = false

  constructor(private authService: AuthService, private router: Router) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.loading = true
    this.errorMessage = ''
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false
        this.router.navigate(['/dashboard'])
      },
      error: (err) => {
        this.loading = false
        this.errorMessage = err.error?.message ?? 'Une erreur est survenue'
      }
    })
  }
}
