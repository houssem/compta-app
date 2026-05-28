// src/app/shared/models/supplier.model.ts

export interface SupplierContact {
  id?: string
  fullName: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
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
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
}

export interface Supplier {
  id: string
  reference: string
  companyName: string
  website: string
  category: string
  rneNumber: string
  regimeFiscal: string
  assujettiTva: boolean
  status: string
  createdAt: string
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
}

export const SUPPLIER_CATEGORIES = [
  'Informatique',
  'Transport',
  'Fournitures',
  'Services professionnels',
  'Télécommunications',
  'Autre',
] as const
