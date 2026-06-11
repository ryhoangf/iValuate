import { productApi } from "@/lib/api"
import { buildFeaturesFromFilters } from "@/lib/filters"
import { suggestImpactConfig } from "@/lib/impactAnalysisConfig"

/**
 * Full search pipeline: listings → market price.
 * @returns {Promise<import('./types/search').SearchBundle>}
 */
export async function runSearchPipeline(keyword, appliedFilters, productId) {
  const searchData = await productApi.search(keyword, appliedFilters)
  const features = buildFeaturesFromFilters(appliedFilters)
  const marketData = await productApi
    .getMarketPrice(keyword, features, productId)
    .catch((err) => {
      if (err?.status !== 404) {
        console.warn("Market price unavailable:", err)
      }
      return null
    })

  const suggestedImpact = suggestImpactConfig(searchData)

  return {
    keyword,
    searchData,
    marketData,
    variantFilters: appliedFilters,
    suggestedImpact,
  }
}
