import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import {
  CompanyProfile, UpdateCompanyRequest,
  CurrencyItem, CountryItem,
  SupportedCurrenciesResponse, SupportedCountriesResponse,
  BankDetailItem, BankDetailRequest
} from '../../shared/models/company-profile.model'

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient)

  getMyCompany(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>('/api/companies/me')
  }

  updateMyCompany(data: UpdateCompanyRequest, logo?: File): Observable<CompanyProfile> {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (logo) {
      formData.append('logo', logo)
    }
    return this.http.put<CompanyProfile>('/api/companies/me', formData)
  }

  getMasterCurrencies(): Observable<CurrencyItem[]> {
    return this.http.get<CurrencyItem[]>('/api/settings/currencies/master')
  }

  getSupportedCurrencies(): Observable<SupportedCurrenciesResponse> {
    return this.http.get<SupportedCurrenciesResponse>('/api/settings/currencies')
  }

  updateSupportedCurrencies(codes: string[]): Observable<SupportedCurrenciesResponse> {
    return this.http.put<SupportedCurrenciesResponse>('/api/settings/currencies', { codes })
  }

  getMasterCountries(): Observable<CountryItem[]> {
    return this.http.get<CountryItem[]>('/api/settings/countries/master')
  }

  getSupportedCountries(): Observable<SupportedCountriesResponse> {
    return this.http.get<SupportedCountriesResponse>('/api/settings/countries')
  }

  updateSupportedCountries(codes: string[]): Observable<SupportedCountriesResponse> {
    return this.http.put<SupportedCountriesResponse>('/api/settings/countries', { codes })
  }

  getBankDetails(): Observable<BankDetailItem[]> {
    return this.http.get<BankDetailItem[]>('/api/settings/bank-details')
  }

  addBankDetail(req: BankDetailRequest): Observable<BankDetailItem> {
    return this.http.post<BankDetailItem>('/api/settings/bank-details', req)
  }

  updateBankDetail(id: string, req: BankDetailRequest): Observable<BankDetailItem> {
    return this.http.put<BankDetailItem>(`/api/settings/bank-details/${id}`, req)
  }

  deleteBankDetail(id: string): Observable<void> {
    return this.http.delete<void>(`/api/settings/bank-details/${id}`)
  }
}
