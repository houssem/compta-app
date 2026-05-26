import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { NgxEchartsModule } from 'ngx-echarts'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import type { EChartsOption } from 'echarts'
import { DashboardService } from '../dashboard/dashboard.service'
import { DashboardSummary } from '../../shared/models/kpi.model'

@Component({
  selector: 'app-dashboard-vente',
  standalone: true,
  imports: [NgxEchartsModule, RouterLink, TranslateModule],
  templateUrl: './dashboard-vente.component.html',
  styleUrls: ['./dashboard-vente.component.scss']
})
export class DashboardVenteComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null)
  loading = signal(true)
  error = signal('')

  private destroyRef = inject(DestroyRef)
  private translate = inject(TranslateService)

  revenueChartOptions: EChartsOption = {}
  donutChartOptions: EChartsOption = {}

  readonly statusData = [
    { labelKey: 'DASHBOARD.STATUS_PAID',    status: 'paid',    count: 78 },
    { labelKey: 'DASHBOARD.STATUS_PENDING', status: 'pending', count: 18 },
    { labelKey: 'DASHBOARD.STATUS_OVERDUE', status: 'overdue', count: 12 },
  ]

  recentInvoices = signal([
    { number: 'INV-2023-089', client: 'Acme Corp Dynamics',   date: '24 oct. 2023', amount: '1 250,00 €', status: 'paid',    labelKey: 'DASHBOARD.STATUS_PAID' },
    { number: 'INV-2023-090', client: 'Global Logistics Ltd', date: '26 oct. 2023', amount: '840,00 €',   status: 'overdue', labelKey: 'DASHBOARD.STATUS_OVERDUE' },
    { number: 'INV-2023-091', client: 'Horizon Ventures',     date: '27 oct. 2023', amount: '3 100,00 €', status: 'pending', labelKey: 'DASHBOARD.STATUS_PENDING' }
  ])

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this._buildCharts()
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._buildCharts())

    this.dashboardService.getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.summary.set(data); this.loading.set(false) },
        error: () => { this.error.set('Impossible de charger les données.'); this.loading.set(false) }
      })
  }

  private _buildCharts(): void {
    const style = getComputedStyle(document.documentElement)
    const c = {
      border:           style.getPropertyValue('--color-border-subtle').trim(),
      onSurfaceVariant: style.getPropertyValue('--color-on-surface-variant').trim(),
      primary:          style.getPropertyValue('--color-primary').trim(),
      statusPaid:       style.getPropertyValue('--color-status-paid').trim(),
      statusPending:    style.getPropertyValue('--color-status-pending').trim(),
      statusOverdue:    style.getPropertyValue('--color-status-overdue').trim(),
      fontFamily:       style.getPropertyValue('--font-family').trim() || 'Inter, sans-serif',
    }

    const months = this.translate.instant('DASHBOARD.MONTHS').split(',')

    this.revenueChartOptions = {
      grid: { top: 8, right: 8, bottom: 0, left: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: c.border } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, fontWeight: 600, color: c.onSurfaceVariant, fontFamily: c.fontFamily }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: c.border } },
        axisLabel: { fontSize: 11, color: c.onSurfaceVariant, fontFamily: c.fontFamily,
          formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }
      },
      series: [{
        type: 'bar',
        data: [3200, 4100, 3800, 3100, 4800, 4200, 3900, 5100, 4400, 4700, 5200, 4900],
        itemStyle: { color: c.primary, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 32
      }],
      tooltip: {
        trigger: 'axis',
        formatter: (p: any) => `${p[0].name}: €${p[0].value.toLocaleString('fr-FR')}`
      }
    }

    this.donutChartOptions = {
      series: [{
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['50%', '50%'],
        label: { show: false },
        emphasis: { scale: false },
        data: [
          { value: 78, name: this.translate.instant('DASHBOARD.STATUS_PAID'),    itemStyle: { color: c.statusPaid } },
          { value: 18, name: this.translate.instant('DASHBOARD.STATUS_PENDING'), itemStyle: { color: c.statusPending } },
          { value: 12, name: this.translate.instant('DASHBOARD.STATUS_OVERDUE'), itemStyle: { color: c.statusOverdue } }
        ]
      }],
      tooltip: { trigger: 'item', formatter: '{b}: {c}' }
    }
  }
}
