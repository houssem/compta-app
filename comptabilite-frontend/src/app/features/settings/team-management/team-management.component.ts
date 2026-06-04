// src/app/features/settings/team-management/team-management.component.ts
import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { UserAdminService } from '../user-admin.service'
import { AuthService } from '../../../core/auth/auth.service'
import { TeamMember, UserRole } from '../../../shared/models/team-member.model'
import { UserFormModalComponent } from './user-form-modal/user-form-modal.component'

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [FormsModule, TranslateModule, UserFormModalComponent],
  templateUrl: './team-management.component.html',
  styleUrl: './team-management.component.scss'
})
export class TeamManagementComponent implements OnInit {
  private userAdminService = inject(UserAdminService)
  private authService      = inject(AuthService)

  private allMembers = signal<TeamMember[]>([])
  loading    = signal(true)
  error      = signal('')
  searchQuery = signal('')

  // Modal
  showModal   = signal(false)
  modalMode   = signal<'create' | 'edit'>('create')
  editMember  = signal<TeamMember | null>(null)

  // Inline delete confirm
  confirmDeleteId = signal<string | null>(null)
  deleting        = signal(false)

  currentUserId = computed(() => this.authService.currentUser()?.id ?? '')

  filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase()
    if (!q) return this.allMembers()
    return this.allMembers().filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  @HostListener('document:click')
  onDocumentClick(): void {
    this.confirmDeleteId.set(null)
  }

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    this.userAdminService.getAll().subscribe({
      next: (members) => { this.allMembers.set(members); this.loading.set(false) },
      error: () => { this.error.set('Impossible de charger les membres.'); this.loading.set(false) }
    })
  }

  openCreate(): void {
    this.editMember.set(null)
    this.modalMode.set('create')
    this.showModal.set(true)
  }

  openEdit(member: TeamMember, event: MouseEvent): void {
    event.stopPropagation()
    this.editMember.set(member)
    this.modalMode.set('edit')
    this.showModal.set(true)
  }

  closeModal(): void {
    this.showModal.set(false)
  }

  onSaved(member: TeamMember): void {
    this.showModal.set(false)
    if (this.modalMode() === 'create') {
      this.allMembers.update(list => [...list, member])
    } else {
      this.allMembers.update(list => list.map(m => m.id === member.id ? member : m))
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
    this.userAdminService.delete(id).subscribe({
      next: () => {
        this.allMembers.update(list => list.filter(m => m.id !== id))
        this.confirmDeleteId.set(null)
        this.deleting.set(false)
      },
      error: () => this.deleting.set(false)
    })
  }

  memberCount(): string {
    const n = this.allMembers().length
    return n === 1 ? '1 membre' : `${n} membres`
  }

  initials(m: TeamMember): string {
    return `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`.toUpperCase()
  }

  avatarColor(m: TeamMember): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
    const index  = (m.firstName.charCodeAt(0) + m.lastName.charCodeAt(0)) % colors.length
    return colors[index]
  }

  roleLabelKey(role: UserRole): string {
    return `SETTINGS.ROLE_${role}`
  }

  roleClass(role: UserRole): string {
    return `tm-badge--${role.toLowerCase()}`
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  }
}
