// src/app/shared/models/supplier.model.ts

export interface SupplierContact {
  fullName: string
  email: string
  phone: string
}

export interface SupplierAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface SupplierFinancial {
  taxId: string
  currency: string
  paymentTerms: string
}

export interface CreateSupplierDto {
  companyName: string
  website: string
  category: string
  contact: SupplierContact
  address: SupplierAddress
  financial: SupplierFinancial
}

export interface Supplier extends CreateSupplierDto {
  id: string
  reference: string
  openBalance: number
  lastInvoiceDate: string
  createdAt: string
}

export const SUPPLIER_CATEGORIES = [
  'Informatique',
  'Transport',
  'Fournitures',
  'Services professionnels',
  'Télécommunications',
  'Autre',
] as const
