import type { ListingFilters, AvailableFilters } from "./types/filters"
import type { ImpactConfig, CounterfactualFilters } from "./types/impact"
import type { SearchBundle } from "./types/search"

export type { ListingFilters, AvailableFilters, ImpactConfig, CounterfactualFilters, SearchBundle }

declare module "@/lib/api" {
  export const authApi: {
    login: (email: string, password: string) => Promise<Record<string, unknown>>
    register: (
      email: string,
      password: string,
      fullName: string,
      planTier?: string
    ) => Promise<Record<string, unknown>>
    forgotPassword: (email: string) => Promise<Record<string, unknown>>
    resetPassword: (token: string, newPassword: string) => Promise<Record<string, unknown>>
    upgradePremiumTrial: () => Promise<Record<string, unknown>>
    downgradePremiumToLite: () => Promise<Record<string, unknown>>
    getMe: () => Promise<Record<string, unknown>>
    updateProfile: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>
  }

  export const productApi: {
    search: (
      keyword: string,
      filters?: Partial<ListingFilters>
    ) => Promise<{
      listings?: unknown[]
      summary?: { count: number; min: number; max: number }
      availableFilters?: AvailableFilters
    }>
    getMarketPrice: (
      keyword: string,
      features?: Record<string, unknown>,
      productId?: string
    ) => Promise<Record<string, unknown> | null>
    postCounterfactualImpact: (opts: {
      productId?: string
      keyword?: string
      filters?: CounterfactualFilters
      includeAllScenarios?: boolean
    }) => Promise<Record<string, unknown>>
    getDepreciationCurve: (opts: {
      productId?: string
      keyword?: string
    }) => Promise<Record<string, unknown>>
    getPriceForecast30d: (opts: {
      productId?: string
      keyword?: string
      horizonDays?: number
    }) => Promise<Record<string, unknown>>
    getBrandCatalog: (opts?: {
      maxBrands?: number
      perBrand?: number
    }) => Promise<Record<string, unknown>>
  }

  export const watchApi: {
    list: (includeOpportunities?: boolean) => Promise<Record<string, unknown>>
    create: (body: Record<string, unknown>) => Promise<Record<string, unknown>>
    remove: (watchId: string) => Promise<Record<string, unknown>>
    dismiss: (watchId: string, listingId: string) => Promise<Record<string, unknown>>
  }
}
