export interface CompanyProfile {
  id: string
  name: string
  vatNumber: string | null
  streetNumber: string | null
  streetName: string | null
  complement: string | null
  district: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  logoPath: string | null
}

export interface UpdateCompanyRequest {
  name: string
  vatNumber: string
  streetNumber: string
  streetName: string
  complement: string
  district: string
  city: string
  postalCode: string
  country: string
}
