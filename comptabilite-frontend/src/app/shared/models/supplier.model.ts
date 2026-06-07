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
  streetNumber: string
  streetName: string
  complement: string
  district: string
  city: string
  postalCode: string
  country: string
}

export interface SupplierFinancial {
  taxId: string
  currency: string
  paymentTerms: string
  defaultAccount: string
  maxCredit: number
  defaultVatRate: number
  discountRate: number
  withholdingTaxType: string
  withholdingTaxRate: number | null
}

export interface SupplierBank {
  bankName: string
  iban: string
  swiftBic: string
}

export interface CreateSupplierDto {
  companyName: string
  website: string
  sector: string
  notes: string
  rneNumber: string
  regimeFiscal: string
  assujettiTva: boolean
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
  bank: SupplierBank
}

export interface Supplier {
  id: string
  reference: string
  companyName: string
  website: string
  sector: string
  rneNumber: string
  regimeFiscal: string
  assujettiTva: boolean
  notes: string | null
  status: string
  createdAt: string
  contacts: SupplierContact[]
  address: SupplierAddress
  financial: SupplierFinancial
  bank: SupplierBank
}

export const SUPPLIER_CATEGORIES = [
  'Informatique',
  'Transport',
  'Fournitures',
  'Services professionnels',
  'Télécommunications',
  'Autre',
] as const

export const WITHHOLDING_TAX_TYPES = [
  { value: '',            label: 'Aucune retenue',                    rate: null },
  { value: 'HONORAIRES',  label: 'Honoraires (libéral)',               rate: 10 },
  { value: 'LOYERS',      label: 'Loyers (personne physique)',          rate: 15 },
  { value: 'TRAVAUX',     label: 'Marchés de travaux / fournitures',   rate: 1.5 },
  { value: 'ETRANGER',    label: 'Fournisseur étranger (prestation)',  rate: null },
] as const
