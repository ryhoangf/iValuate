import { parseStorageToGb, parseRamToGb } from "@/lib/formatSpecs"
import { parseBaseSpecs } from "@/lib/parseBaseSpecs"

export const DEFAULT_IMPACT_CONFIG = {
  storage: null,
  ram: null,
  analysisBattery: 82,
  condition: "all",
  hasBox: false,
  hasCharger: false,
  screenCondition: "all",
  bodyCondition: "all",
}

export function pickDefaultSpecFromListings(listings, kind) {
  const counts = {}
  for (const row of listings || []) {
    const specs = parseBaseSpecs(row.base_specs)
    const raw =
      kind === "storage"
        ? specs.storage ?? specs.storage_gb ?? specs.capacity
        : specs.ram ?? specs.ram_gb
    const norm = kind === "storage" ? parseStorageToGb(raw) : parseRamToGb(raw)
    if (norm) counts[norm] = (counts[norm] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}

export function medianBatteryFromListings(listings) {
  const batteries = (listings || [])
    .map((l) => l.battery_health ?? l.battery_percentage)
    .filter((v) => v != null && !Number.isNaN(Number(v)) && Number(v) > 0)
    .map(Number)
    .sort((a, b) => a - b)

  if (!batteries.length) return null

  const mid = Math.floor(batteries.length / 2)
  return batteries.length % 2 !== 0
    ? batteries[mid]
    : Math.round((batteries[mid - 1] + batteries[mid]) / 2)
}

/** Suggested ML scenario from current listing results (independent of listing filters). */
export function hasRamFilterOptions(availableFilters) {
  return (availableFilters?.rams?.length ?? 0) > 0
}

/** ML run needs storage; RAM only when listing data exposes RAM variants. */
export function canRunImpactAnalysis(config, availableFilters) {
  if (!config?.storage) return false
  if (hasRamFilterOptions(availableFilters) && !config?.ram) return false
  return true
}

export function suggestImpactConfig(searchData) {
  const af = searchData?.availableFilters
  const listings = searchData?.listings || []

  const storage =
    pickDefaultSpecFromListings(listings, "storage") || af?.storages?.[0] || null
  const ram = pickDefaultSpecFromListings(listings, "ram") || af?.rams?.[0] || null
  const analysisBattery = medianBatteryFromListings(listings) ?? 82

  return {
    storage: storage ? String(storage) : null,
    ram: ram ? String(ram) : null,
    analysisBattery,
    condition: "all",
    hasBox: false,
    hasCharger: false,
    screenCondition: "all",
    bodyCondition: "all",
  }
}

export function toCounterfactualFilters(config, includeAllScenarios = false) {
  if (!config) return { include_all_scenarios: includeAllScenarios }

  return {
    storage: config.storage || undefined,
    ram: config.ram || undefined,
    analysis_battery: config.analysisBattery,
    condition: config.condition !== "all" ? config.condition : undefined,
    hasBox: config.hasBox,
    hasCharger: config.hasCharger,
    screenCondition:
      config.screenCondition !== "all" ? config.screenCondition : undefined,
    bodyCondition: config.bodyCondition !== "all" ? config.bodyCondition : undefined,
    include_all_scenarios: includeAllScenarios,
  }
}
