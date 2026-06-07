import { Routes } from '@angular/router'

export const settingsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile'
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./team-management/team-management.component').then(m => m.TeamManagementComponent)
  },
  {
    path: 'currencies',
    loadComponent: () =>
      import('./currencies/currencies.component').then(m => m.CurrenciesComponent)
  },
  {
    path: 'countries',
    loadComponent: () =>
      import('./countries/countries.component').then(m => m.CountriesComponent)
  },
  {
    path: 'bank-details',
    loadComponent: () =>
      import('./bank-details/bank-details.component').then(m => m.BankDetailsComponent)
  }
]
