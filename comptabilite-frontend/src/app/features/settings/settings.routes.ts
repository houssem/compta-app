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
  }
]
