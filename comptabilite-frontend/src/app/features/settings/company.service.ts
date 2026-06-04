import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { CompanyProfile, UpdateCompanyRequest } from '../../shared/models/company-profile.model'

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
}
