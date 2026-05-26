import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ApiPurchaseInvoice, StoredPurchaseInvoice, CreatePurchaseInvoicePayload } from '../../shared/models/purchase-invoice.model'

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private http = inject(HttpClient)

  getAll(): Observable<ApiPurchaseInvoice[]> {
    return this.http.get<ApiPurchaseInvoice[]>('/api/purchase-invoices')
  }

  getById(id: string): Observable<StoredPurchaseInvoice> {
    return this.http.get<StoredPurchaseInvoice>(`/api/purchase-invoices/${id}`)
  }

  create(payload: CreatePurchaseInvoicePayload): Observable<StoredPurchaseInvoice> {
    return this.http.post<StoredPurchaseInvoice>('/api/purchase-invoices', payload)
  }

  update(id: string, payload: CreatePurchaseInvoicePayload): Observable<StoredPurchaseInvoice> {
    return this.http.put<StoredPurchaseInvoice>(`/api/purchase-invoices/${id}`, payload)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/purchase-invoices/${id}`)
  }
}
