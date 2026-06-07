// src/app/shared/models/client.model.ts

export interface Country {
  id: number
  code: string   // ISO 3166-1 alpha-2
  value: string  // full name used in forms and stored in DB address fields
  label: string
}

export interface Currency {
  id: number
  isoCode: string // ISO 4217 (e.g. 'TND', 'EUR')
  value: string   // same as isoCode — used as form/DB value
  label: string
  symbol: string
}

export interface PaymentTerm {
  id: number
  value: string
  label: string
  days: number
}

export const COUNTRIES: Country[] = [
  { id:  1, code: 'TN', value: 'Tunisie',         label: 'Tunisie'          },
  { id:  2, code: 'DZ', value: 'Algérie',         label: 'Algérie'          },
  { id:  3, code: 'MA', value: 'Maroc',           label: 'Maroc'            },
  { id:  4, code: 'LY', value: 'Libye',           label: 'Libye'            },
  { id:  5, code: 'FR', value: 'France',          label: 'France'           },
  { id:  6, code: 'DE', value: 'Allemagne',       label: 'Allemagne'        },
  { id:  7, code: 'IT', value: 'Italie',          label: 'Italie'           },
  { id:  8, code: 'ES', value: 'Espagne',         label: 'Espagne'          },
  { id:  9, code: 'GB', value: 'Royaume-Uni',     label: 'Royaume-Uni'      },
  { id: 10, code: 'US', value: 'États-Unis',      label: 'États-Unis'       },
  { id: 11, code: 'AE', value: 'Émirats arabes',  label: 'Émirats arabes'   },
  { id: 12, code: 'SA', value: 'Arabie Saoudite', label: 'Arabie Saoudite'  },
  { id: 13, code: 'XX', value: 'Autre',           label: 'Autre'            },
]

export const CURRENCIES: Currency[] = [
  { id: 1, isoCode: 'TND', value: 'TND', label: 'TND – Dinar tunisien',    symbol: 'DT' },
  { id: 2, isoCode: 'EUR', value: 'EUR', label: 'EUR – Euro',              symbol: '€'  },
  { id: 3, isoCode: 'USD', value: 'USD', label: 'USD – Dollar américain',  symbol: '$'  },
  { id: 4, isoCode: 'GBP', value: 'GBP', label: 'GBP – Livre sterling',   symbol: '£'  },
]

export const PAYMENT_TERMS: PaymentTerm[] = [
  { id: 1, value: 'Immédiat', label: 'Paiement immédiat', days: 0  },
  { id: 2, value: 'Net 15',   label: 'Net 15 jours',      days: 15 },
  { id: 3, value: 'Net 30',   label: 'Net 30 jours',      days: 30 },
  { id: 4, value: 'Net 45',   label: 'Net 45 jours',      days: 45 },
  { id: 5, value: 'Net 60',   label: 'Net 60 jours',      days: 60 },
  { id: 6, value: 'Net 90',   label: 'Net 90 jours',      days: 90 },
  { id: 7, value: 'Fin mois', label: 'Fin de mois',       days: 30 },
]

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'Tunisie':         'TND',
  'Algérie':         'TND',
  'Maroc':           'TND',
  'Libye':           'TND',
  'France':          'EUR',
  'Allemagne':       'EUR',
  'Italie':          'EUR',
  'Espagne':         'EUR',
  'Royaume-Uni':     'GBP',
  'États-Unis':      'USD',
  'Émirats arabes':  'USD',
  'Arabie Saoudite': 'USD',
  'Autre':           'TND',
}

export const CLIENT_STATUSES = [
  { value: 'ACTIVE',    label: 'Actif'     },
  { value: 'INACTIVE',  label: 'Inactif'   },
  { value: 'SUSPENDU',  label: 'Suspendu'  },
]

export interface ClientContact {
  fullName: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

export interface ClientAddress {
  streetNumber: string
  streetName: string
  complement: string
  district: string
  city: string
  postalCode: string
  country: string
}

export interface ClientFinancial {
  currency: string
  paymentTerms: string
  maxCredit: number
  defaultVatRate: number
  discountRate: number
  defaultAccount: string
}

export interface CreateClientDto {
  companyName: string
  legalForm: string
  sector: string
  notes: string
  status: string
  rneNumber: string
  matriculeFiscal: string
  regimeFiscal: string
  assujettiTva: boolean
  website: string
  contacts: ClientContact[]
  billingAddress: ClientAddress
  financial: ClientFinancial
}

export interface Client extends CreateClientDto {
  id: string
  reference: string
  createdAt: string
}
