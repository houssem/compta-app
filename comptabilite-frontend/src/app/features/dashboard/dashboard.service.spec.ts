import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { DashboardService } from './dashboard.service'
import { DashboardSummary } from '../../shared/models/kpi.model'

describe('DashboardService', () => {
  let service: DashboardService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    })
    service = TestBed.inject(DashboardService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getSummary() calls GET /api/dashboard/summary and returns data', () => {
    const mockData: DashboardSummary = {
      kpis: {
        invoicesCount: 47, invoicesCountVariation: 12,
        totalAmountHT: 128450, totalAmountVariation: 8.5,
        pendingAmount: 34200, pendingCount: 11,
        overdueAmount: 9800, overdueCount: 3
      },
      revenueSeries: [{ month: 'Jan', amount: 1000 }],
      statusDistribution: [{ status: 'Payée', count: 28 }],
      comparisonSeries: [{ month: 'Jan', invoiced: 1000, collected: 900 }]
    }
    let result: DashboardSummary | undefined
    service.getSummary().subscribe(data => { result = data })
    const req = httpMock.expectOne('/api/dashboard/summary')
    expect(req.request.method).toBe('GET')
    req.flush(mockData)
    expect(result).toEqual(mockData)
  })
})
