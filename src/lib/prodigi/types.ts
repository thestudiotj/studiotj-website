export type ISO2 = string
export type Lab = 'EU' | 'UK' | 'US'
export type ShippingMethod = 'Budget' | 'Standard' | 'StandardPlus' | 'Express' | 'Overnight'
export type SizingMode = 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea' | 'crop'

export interface ProdigiAddress {
  line1: string
  line2?: string
  postalOrZipCode: string
  countryCode: ISO2
  townOrCity: string
  stateOrCounty?: string
}

export interface ProdigiRecipient {
  name: string
  email?: string
  phoneNumber?: string
  address: ProdigiAddress
}

export interface ProdigiAsset {
  printArea: string
  url: string
  pageCount?: number
}

export interface ProdigiItem {
  sku: string
  copies: number
  sizing: SizingMode
  attributes?: Record<string, string>
  assets: ProdigiAsset[]
}

export interface ProdigiOrderRequest {
  merchantReference?: string
  shippingMethod: ShippingMethod
  recipient: ProdigiRecipient
  items: ProdigiItem[]
  callbackUrl?: string
  idempotencyKey?: string
  metadata?: Record<string, string>
}

export interface ProdigiOrderStatus {
  stage: 'InProgress' | 'Complete' | 'Cancelled'
  issues: unknown[]
  details: {
    downloadAssets: string
    printReadyAssetsPrepared: string
    allocateProductionLocation: string
    inProduction: string
    shipping: string
  }
}

export interface ProdigiOrder {
  id: string
  created: string
  lastUpdated: string
  callbackUrl: string | null
  merchantReference: string | null
  shippingMethod: ShippingMethod
  idempotencyKey: string | null
  status: ProdigiOrderStatus
  charges: unknown[]
  shipments: unknown[]
  recipient: ProdigiRecipient
  items: Array<ProdigiItem & { id: string; status: string }>
}

export interface ProdigiOrderResponse {
  outcome: 'Created' | 'OnHold' | 'CreatedWithIssues' | 'AlreadyExists'
  order: ProdigiOrder
}

export interface ProdigiQuoteRequest {
  shippingMethod: ShippingMethod
  destinationCountryCode: ISO2
  currencyCode: string
  items: Omit<ProdigiItem, 'sizing'>[]
}

export interface ProdigiQuote {
  shipmentMethod: ShippingMethod
  costSummary: {
    items: { amount: string; currency: string }
    shipping: { amount: string; currency: string }
  }
  shipments: Array<{
    carrier: { name: string; service: string }
    fulfillmentLocation: { countryCode: ISO2; labCode: string }
    cost: { amount: string; currency: string }
    items: string[]
  }>
  items: Array<{ id: string; sku: string; copies: number; unitCost: { amount: string; currency: string } }>
}

export interface ProdigiQuoteResponse {
  outcome: 'Created' | 'CreatedWithIssues'
  quotes: ProdigiQuote[]
}
