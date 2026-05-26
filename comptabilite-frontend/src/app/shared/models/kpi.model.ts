export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface KpiSummary {
  invoicesCount: number
  invoicesCountVariation: number
  totalAmountHT: number
  totalAmountVariation: number
  pendingAmount: number
  pendingCount: number
  overdueAmount: number
  overdueCount: number
}

export interface DashboardSummary {
  kpis: KpiSummary
  revenueSeries: { month: string; amount: number }[]
  statusDistribution: { status: string; count: number }[]
  comparisonSeries: { month: string; invoiced: number; collected: number }[]
}
