import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ApiInvoice, StoredInvoice, CreateInvoicePayload } from '../../shared/models/invoice.model'

export interface Language { id: number; value: string; label: string }

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient)

  getAll(): Observable<ApiInvoice[]> {
    return this.http.get<ApiInvoice[]>('/api/invoices')
  }

  getById(id: string): Observable<StoredInvoice> {
    return this.http.get<StoredInvoice>(`/api/invoices/${id}`)
  }

  create(payload: CreateInvoicePayload): Observable<StoredInvoice> {
    return this.http.post<StoredInvoice>('/api/invoices', payload)
  }

  update(id: string, payload: CreateInvoicePayload): Observable<StoredInvoice> {
    return this.http.put<StoredInvoice>(`/api/invoices/${id}`, payload)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/invoices/${id}`)
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>('/api/languages')
  }
}
