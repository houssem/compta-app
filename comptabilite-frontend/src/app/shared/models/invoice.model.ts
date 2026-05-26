export type InvoiceStatus = 'overdue' | 'paid' | 'pending' | 'approved' | 'draft' | 'sent'

export interface LineItem {
  id: number
  description: string
  qty: number
  priceHT: number
  discPct: number
  vatPct: number
}

export interface ApiInvoice {
  id: number | string
  clientName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  totalTTC: number
  status: InvoiceStatus
  createdAt: string
}

export interface StoredInvoice {
  id: number | string
  clientId: string
  clientName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  language: string
  lineItems: LineItem[]
  internalNotes: string
  termsAndConditions: string
  status: string
}

export interface CreateInvoicePayload {
  clientId: string
  clientName: string
  issueDate: string
  dueDate: string
  currency: string
  language: string
  lineItems: LineItem[]
  internalNotes: string
  termsAndConditions: string
  totalHT: number
  totalTTC: number
  status: string
  createdAt: string
}
