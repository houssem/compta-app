import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Client, CreateClientDto, Country, Currency, PaymentTerm } from '../../shared/models/client.model'

@Injectable({ providedIn: 'root' })
export class ClientService {
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

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients')
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`/api/clients/${id}`)
  }

  create(dto: CreateClientDto): Observable<Client> {
    return this.http.post<Client>('/api/clients', dto)
  }

  update(id: string, dto: CreateClientDto): Observable<Client> {
    return this.http.put<Client>(`/api/clients/${id}`, dto)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/clients/${id}`)
  }
}
