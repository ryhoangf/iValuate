export type FilterAll = "all"

export type ListingFilters = {
  storage: string | FilterAll | null
  ram: string | FilterAll | null
  condition: string | FilterAll
  color: string | FilterAll
  platform: string | FilterAll
  batteryStatus: string | FilterAll
  screenCondition: string | FilterAll
  bodyCondition: string | FilterAll
  minBattery: number | null
  batteryReplaced: boolean | null
  hasBox: boolean | null
  hasCharger: boolean | null
  hasCable: boolean | null
  hasEarphones: boolean | null
  isSimFree: boolean | null
  fullyFunctional: boolean | null
  minPrice?: number
  maxPrice?: number
}

export type AvailableFilters = {
  storages?: string[]
  rams?: string[]
  conditions?: string[]
  colors?: string[]
  platforms?: string[]
  batteryStatuses?: string[]
  screenConditions?: string[]
  bodyConditions?: string[]
  batteryRange?: { min: number; max: number }
}
