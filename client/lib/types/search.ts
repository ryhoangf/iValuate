import type { AvailableFilters } from "./filters"
import type { ImpactConfig } from "./impact"

export type SearchBundle = {
  keyword: string
  searchData: {
    listings?: unknown[]
    summary?: { count: number; min: number; max: number }
    availableFilters?: AvailableFilters
  }
  marketData: Record<string, unknown> | null
  variantFilters: import("./filters").ListingFilters
  suggestedImpact: ImpactConfig
}
