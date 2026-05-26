// src/app/features/suppliers/supplier.service.ts
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Supplier, CreateSupplierDto } from '../../shared/models/supplier.model'
import { Country, Currency, PaymentTerm } from '../../shared/models/client.model'

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>('/api/countries')
  }

  getCurrencies(): Observable<Currency[]> {
    return this.http.get<Currency[]>('/api/currencies')
  }

  getPaymentTerms(): Observable<PaymentTerm[]> {
    return this.http.get<PaymentTerm[]>('/api/paymentTerms')
  }

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>('/api/suppliers')
  }

  getById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`/api/suppliers/${id}`)
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>('/api/suppliers', dto)
  }

  update(id: string, dto: CreateSupplierDto): Observable<Supplier> {
    return this.http.put<Supplier>(`/api/suppliers/${id}`, dto)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/suppliers/${id}`)
  }
}
