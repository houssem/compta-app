import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { MainLayoutComponent } from './core/layout/main-layout.component'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard-vente',
        loadComponent: () =>
          import('./features/dashboard-vente/dashboard-vente.component').then(m => m.DashboardVenteComponent)
      },
      { path: 'dashboard', redirectTo: 'dashboard-vente' },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/clients/clients.component').then(m => m.ClientsComponent)
      },
      {
        path: 'client/create',
        loadComponent: () =>
          import('./features/clients/new-client/new-client.component').then(m => m.NewClientComponent)
      },
      {
        path: 'client/edit/:id',
        loadComponent: () =>
          import('./features/clients/new-client/new-client.component').then(m => m.NewClientComponent)
      },
      {
        path: 'invoice/create',
        loadComponent: () =>
          import('./features/invoices/new-invoice/new-invoice.component').then(m => m.NewInvoiceComponent)
      },
      {
        path: 'invoice/edit/:id',
        loadComponent: () =>
          import('./features/invoices/new-invoice/new-invoice.component').then(m => m.NewInvoiceComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers.component').then(m => m.SuppliersComponent)
      },
      {
        path: 'supplier/create',
        loadComponent: () =>
          import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent)
      },
      {
        path: 'supplier/edit/:id',
        loadComponent: () =>
          import('./features/suppliers/new-supplier/new-supplier.component').then(m => m.NewSupplierComponent)
      },
      {
        path: 'purchase-invoices',
        loadComponent: () =>
          import('./features/purchase-invoices/purchase-invoices.component').then(m => m.PurchaseInvoicesComponent)
      },
      {
        path: 'purchase-invoice/create',
        loadComponent: () =>
          import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent)
      },
      {
        path: 'purchase-invoice/edit/:id',
        loadComponent: () =>
          import('./features/purchase-invoices/new-purchase-invoice/new-purchase-invoice.component').then(m => m.NewPurchaseInvoiceComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard-vente' }
]
