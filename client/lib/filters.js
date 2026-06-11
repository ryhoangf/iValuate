/** @typedef {import('./types/filters').ListingFilters} ListingFilters */

export const INITIAL_FILTERS = {
  storage: "all",
  ram: "all",
  condition: "all",
  color: "all",
  platform: "all",
  batteryStatus: "all",
  screenCondition: "all",
  bodyCondition: "all",
  minBattery: null,
  batteryReplaced: null,
  hasBox: null,
  hasCharger: null,
  hasCable: null,
  hasEarphones: null,
  isSimFree: null,
  fullyFunctional: null,
}

/** Variant filter is unset (show all variants). */
export function isVariantUnset(value) {
  return value == null || value === "all"
}

/** User picked a concrete storage/RAM variant. */
export function isVariantActive(value) {
  return value != null && value !== "all"
}

/** @param {ListingFilters} filters @param {object} [availableFilters] */
export function hasActiveFilters(filters, availableFilters) {
  const batteryMin = availableFilters?.batteryRange?.min
  const batteryActive =
    batteryMin != null &&
    filters.minBattery != null &&
    filters.minBattery > batteryMin

  return (
    isVariantActive(filters.storage) ||
    isVariantActive(filters.ram) ||
    filters.condition !== "all" ||
    filters.color !== "all" ||
    filters.platform !== "all" ||
    filters.batteryStatus !== "all" ||
    filters.screenCondition !== "all" ||
    filters.bodyCondition !== "all" ||
    filters.batteryReplaced !== null ||
    filters.hasBox !== null ||
    filters.hasCharger !== null ||
    filters.hasCable !== null ||
    filters.hasEarphones !== null ||
    filters.isSimFree !== null ||
    filters.fullyFunctional !== null ||
    batteryActive
  )
}

/** @param {object} [availableFilters] @returns {ListingFilters} */
export function getResetFilters(availableFilters) {
  return {
    storage: "all",
    ram: "all",
    condition: "all",
    color: "all",
    platform: "all",
    batteryStatus: "all",
    screenCondition: "all",
    bodyCondition: "all",
    minBattery: availableFilters?.batteryRange?.min ?? null,
    batteryReplaced: null,
    hasBox: null,
    hasCharger: null,
    hasCable: null,
    hasEarphones: null,
    isSimFree: null,
    fullyFunctional: null,
  }
}

/** @param {ListingFilters} appliedFilters */
export function buildFeaturesFromFilters(appliedFilters) {
  return {
    storage: isVariantActive(appliedFilters.storage)
      ? appliedFilters.storage
      : undefined,
    ram: isVariantActive(appliedFilters.ram) ? appliedFilters.ram : undefined,
    condition:
      appliedFilters.condition !== "all" ? appliedFilters.condition : undefined,
    color: appliedFilters.color !== "all" ? appliedFilters.color : undefined,
    battery_health: appliedFilters.minBattery,
    screenCondition:
      appliedFilters.screenCondition !== "all"
        ? appliedFilters.screenCondition
        : undefined,
    bodyCondition:
      appliedFilters.bodyCondition !== "all"
        ? appliedFilters.bodyCondition
        : undefined,
    batteryStatus:
      appliedFilters.batteryStatus !== "all"
        ? appliedFilters.batteryStatus
        : undefined,
    batteryReplaced: appliedFilters.batteryReplaced,
    hasBox: appliedFilters.hasBox,
    hasCharger: appliedFilters.hasCharger,
    hasCable: appliedFilters.hasCable,
    hasEarphones: appliedFilters.hasEarphones,
    isSimFree: appliedFilters.isSimFree,
    fullyFunctional: appliedFilters.fullyFunctional,
  }
}

/** Stable cache key segment for React Query. */
export function serializeFiltersForCache(filters) {
  return JSON.stringify(filters ?? {})
}
