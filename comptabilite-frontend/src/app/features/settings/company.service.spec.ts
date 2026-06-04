import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { CompanyService } from './company.service'
import { CompanyProfile, UpdateCompanyRequest } from '../../shared/models/company-profile.model'

const MOCK_PROFILE: CompanyProfile = {
  id: 'uuid-1', name: 'Compta Pro', vatNumber: 'TN123', logoPath: null,
  streetNumber: '12', streetName: 'Rue de la Paix', complement: '',
  district: '', city: 'Tunis', postalCode: '1001', country: 'Tunisie'
}

describe('CompanyService', () => {
  let service: CompanyService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(CompanyService)
    http    = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getMyCompany() calls GET /api/companies/me', () => {
    let result: CompanyProfile | undefined
    service.getMyCompany().subscribe(r => (result = r))
    const req = http.expectOne('/api/companies/me')
    expect(req.request.method).toBe('GET')
    req.flush(MOCK_PROFILE)
    expect(result).toEqual(MOCK_PROFILE)
  })

  it('updateMyCompany() calls PUT /api/companies/me with FormData', () => {
    const update: UpdateCompanyRequest = {
      name: 'Updated', vatNumber: 'TN999', streetNumber: '1',
      streetName: 'Rue Neuve', complement: '', district: '',
      city: 'Sfax', postalCode: '3000', country: 'Tunisie'
    }
    let result: CompanyProfile | undefined
    service.updateMyCompany(update).subscribe(r => (result = r))
    const req = http.expectOne('/api/companies/me')
    expect(req.request.method).toBe('PUT')
    expect(req.request.body instanceof FormData).toBeTrue()
    req.flush({ ...MOCK_PROFILE, ...update })
    expect(result?.name).toBe('Updated')
  })
})
