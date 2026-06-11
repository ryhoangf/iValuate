export type ImpactConfig = {
  storage: string | null
  ram: string | null
  analysisBattery: number
  condition: string
  hasBox: boolean
  hasCharger: boolean
  screenCondition: string
  bodyCondition: string
}

export type CounterfactualFilters = {
  storage?: string
  ram?: string
  analysis_battery?: number
  condition?: string
  hasBox?: boolean
  hasCharger?: boolean
  screenCondition?: string
  bodyCondition?: string
  include_all_scenarios?: boolean
}
