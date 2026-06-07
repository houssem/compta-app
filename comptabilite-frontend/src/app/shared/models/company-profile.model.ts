export interface CurrencyItem {
  isoCode: string
  currencyName: string
  symbol?: string
}

export interface CountryItem {
  isoCode: string
  countryName: string
  currency: string
}

export interface SupportedCurrenciesResponse {
  defaultCurrency: string
  currencies: CurrencyItem[]
}

export interface SupportedCountriesResponse {
  countries: CountryItem[]
}

export interface CompanyProfile {
  id: string
  name: string
  legalForm: string | null
  regimeFiscal: string | null
  assujettiTva: boolean
  website: string | null
  matriculeFiscal: string | null
  rneNumber: string | null
  sector: string | null
  streetNumber: string | null
  streetName: string | null
  complement: string | null
  district: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
  email: string | null
  currency: string | null
  status: string | null
  notes: string | null
  logoPath: string | null
}

export interface BankDetailItem {
  id: string
  accountHolder: string | null
  bankName: string | null
  branch: string | null
  accountNumber: string | null
  iban: string | null
  swiftBic: string | null
  currency: string
  defaultAccount: boolean
}

export interface BankDetailRequest {
  accountHolder: string | null
  bankName: string | null
  branch: string | null
  accountNumber: string | null
  iban: string | null
  swiftBic: string | null
  currency: string
  defaultAccount: boolean
}

export interface UpdateCompanyRequest {
  name: string
  legalForm: string
  regimeFiscal: string
  assujettiTva: boolean
  website: string
  matriculeFiscal: string
  rneNumber: string
  sector: string
  streetNumber: string
  streetName: string
  complement: string
  district: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  currency: string
  notes: string
}
