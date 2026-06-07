import { Component, inject, OnInit, signal, HostListener } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { CompanyService } from '../company.service'
import { BankDetailItem } from '../../../shared/models/company-profile.model'
import { BankDetailFormModalComponent } from './bank-detail-form-modal/bank-detail-form-modal.component'

@Component({
  selector: 'app-bank-details',
  standalone: true,
  imports: [TranslateModule, BankDetailFormModalComponent],
  templateUrl: './bank-details.component.html',
  styleUrl: './bank-details.component.scss'
})
export class BankDetailsComponent implements OnInit {
  private companyService = inject(CompanyService)

  items           = signal<BankDetailItem[]>([])
  loading         = signal(true)
  error           = signal('')
  showModal       = signal(false)
  modalMode       = signal<'create' | 'edit'>('create')
  editItem        = signal<BankDetailItem | null>(null)
  confirmDeleteId = signal<string | null>(null)
  deleting        = signal(false)

  @HostListener('document:click')
  onDocumentClick(): void {
    this.confirmDeleteId.set(null)
  }

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    this.companyService.getBankDetails().subscribe({
      next: (list) => { this.items.set(list); this.loading.set(false) },
      error: () => { this.error.set('SETTINGS.BANK_LOAD_ERROR'); this.loading.set(false) }
    })
  }

  openCreate(): void {
    this.editItem.set(null)
    this.modalMode.set('create')
    this.showModal.set(true)
  }

  openEdit(item: BankDetailItem, event: MouseEvent): void {
    event.stopPropagation()
    this.editItem.set(item)
    this.modalMode.set('edit')
    this.showModal.set(true)
  }

  closeModal(): void {
    this.showModal.set(false)
  }

  onSaved(item: BankDetailItem): void {
    this.showModal.set(false)
    if (this.modalMode() === 'create') {
      // If new item is default, unset existing default in UI
      if (item.defaultAccount) {
        this.items.update(list => list.map(i => ({ ...i, defaultAccount: false })))
      }
      this.items.update(list => [...list, item])
    } else {
      if (item.defaultAccount) {
        this.items.update(list => list.map(i => ({ ...i, defaultAccount: i.id === item.id })))
      } else {
        this.items.update(list => list.map(i => i.id === item.id ? item : i))
      }
    }
  }

  startDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(id)
  }

  cancelDelete(event: MouseEvent): void {
    event.stopPropagation()
    this.confirmDeleteId.set(null)
  }

  confirmDelete(id: string, event: MouseEvent): void {
    event.stopPropagation()
    this.deleting.set(true)
    this.companyService.deleteBankDetail(id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== id))
        this.confirmDeleteId.set(null)
        this.deleting.set(false)
      },
      error: () => { this.deleting.set(false); this.error.set('SETTINGS.BANK_DELETE_ERROR') }
    })
  }

  maskedIban(iban: string | null): string {
    if (!iban || iban.length < 8) return iban ?? ''
    return iban.slice(0, 4) + ' •••• ' + iban.slice(-3)
  }
}
