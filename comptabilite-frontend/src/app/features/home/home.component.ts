import { Component, OnInit, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { AuthService } from '../../core/auth/auth.service'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService)
  private router = inject(Router)

  ngOnInit() {
    if (this.auth.currentUser() !== null) {
      this.router.navigate(['/dashboard-vente'])
    }
  }
}
