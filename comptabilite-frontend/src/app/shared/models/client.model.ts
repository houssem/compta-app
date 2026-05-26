// src/app/shared/models/client.model.ts

export interface Country {
  id: number
  value: string
  label: string
}

export interface Currency {
  id: number
  value: string
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
  { id:  1, value: 'Tunisie',         label: 'Tunisie'          },
  { id:  2, value: 'Algérie',         label: 'Algérie'          },
  { id:  3, value: 'Maroc',           label: 'Maroc'            },
  { id:  4, value: 'Libye',           label: 'Libye'            },
  { id:  5, value: 'France',          label: 'France'           },
  { id:  6, value: 'Allemagne',       label: 'Allemagne'        },
  { id:  7, value: 'Italie',          label: 'Italie'           },
  { id:  8, value: 'Espagne',         label: 'Espagne'          },
  { id:  9, value: 'Royaume-Uni',     label: 'Royaume-Uni'      },
  { id: 10, value: 'États-Unis',      label: 'États-Unis'       },
  { id: 11, value: 'Émirats arabes',  label: 'Émirats arabes'   },
  { id: 12, value: 'Arabie Saoudite', label: 'Arabie Saoudite'  },
  { id: 13, value: 'Autre',           label: 'Autre'            },
]

export const CURRENCIES: Currency[] = [
  { id: 1, value: 'TND', label: 'TND', symbol: 'DT' },
  { id: 2, value: 'EUR', label: 'EUR – Euro', symbol: '€' },
  { id: 3, value: 'USD', label: 'USD – Dollar américain', symbol: '$' },
  { id: 4, value: 'GBP', label: 'GBP – Livre sterling', symbol: '£' },
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

export const CLIENT_TYPES = [
  { value: 'PROFESSIONNEL', label: 'Professionnel (B2B)' },
  { value: 'PARTICULIER',   label: 'Particulier (B2C)'   },
]

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
}

export interface CreateClientDto {
  companyName: string
  legalForm: string
  clientType: string
  category: string
  notes: string
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
  status: string
  createdAt: string
}
