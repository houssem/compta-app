import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ApiInvoice, StoredInvoice, CreateInvoicePayload } from '../../shared/models/invoice.model'

export interface Language { id: number; value: string; label: string }

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient)

  getAll(): Observable<ApiInvoice[]> {
    return this.http.get<ApiInvoice[]>('/api/sales-invoices')
  }

  getById(id: string): Observable<StoredInvoice> {
    return this.http.get<StoredInvoice>(`/api/sales-invoices/${id}`)
  }

  create(payload: CreateInvoicePayload): Observable<StoredInvoice> {
    return this.http.post<StoredInvoice>('/api/sales-invoices', payload)
  }

  update(id: string, payload: CreateInvoicePayload): Observable<StoredInvoice> {
    return this.http.put<StoredInvoice>(`/api/sales-invoices/${id}`, payload)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/sales-invoices/${id}`)
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>('/api/languages')
  }
}
