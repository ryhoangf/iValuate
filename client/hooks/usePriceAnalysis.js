"use client"

import { useCallback, useState } from "react"
import { productApi } from "@/lib/api"
import {
  canRunImpactAnalysis,
  suggestImpactConfig,
  toCounterfactualFilters,
} from "@/lib/impactAnalysisConfig"

export function isPremiumAnalysis(marketData) {
  return marketData?.subscriptionTier === "premium"
}

export function usePriceAnalysis({ currentKeyword, searchResults, marketPriceData }) {
  const [depreciationCurve, setDepreciationCurve] = useState(null)
  const [depreciationLoading, setDepreciationLoading] = useState(false)
  const [depreciationError, setDepreciationError] = useState(null)
  const [forecast30d, setForecast30d] = useState(null)
  const [forecast30dLoading, setForecast30dLoading] = useState(false)
  const [forecast30dError, setForecast30dError] = useState(null)
  const [counterfactualReport, setCounterfactualReport] = useState(null)
  const [counterfactualLoading, setCounterfactualLoading] = useState(false)
  const [counterfactualError, setCounterfactualError] = useState(null)
  const [counterfactualIncludeAll, setCounterfactualIncludeAll] = useState(false)
  const [impactConfig, setImpactConfig] = useState(null)

  const resetAnalysis = useCallback(() => {
    setDepreciationCurve(null)
    setDepreciationLoading(false)
    setDepreciationError(null)
    setForecast30d(null)
    setForecast30dLoading(false)
    setForecast30dError(null)
    setCounterfactualReport(null)
    setCounterfactualLoading(false)
    setCounterfactualError(null)
    setCounterfactualIncludeAll(false)
    setImpactConfig(null)
  }, [])

  const loadCounterfactual = useCallback(
    async (keyword, config, includeAll, availableFilters, productId) => {
      if (!keyword || !canRunImpactAnalysis(config, availableFilters)) return
      setCounterfactualLoading(true)
      setCounterfactualError(null)
      try {
        const data = await productApi.postCounterfactualImpact({
          productId: productId || undefined,
          keyword,
          filters: toCounterfactualFilters(config, includeAll),
          includeAllScenarios: includeAll,
        })
        setCounterfactualReport(data)
      } catch (e) {
        setCounterfactualReport(null)
        setCounterfactualError(e.message || String(e))
      } finally {
        setCounterfactualLoading(false)
      }
    },
    []
  )

  const loadPremiumSideEffects = useCallback(
    (keyword, bundle, includeAll = false) => {
      const { marketData, searchData, suggestedImpact } = bundle
      setImpactConfig(suggestedImpact)

      const premium = isPremiumAnalysis(marketData)
      if (!premium) {
        setDepreciationCurve(null)
        setDepreciationError(null)
        setDepreciationLoading(false)
        setForecast30d(null)
        setForecast30dError(null)
        setForecast30dLoading(false)
        setCounterfactualReport(null)
        setCounterfactualError(null)
        setCounterfactualLoading(false)
        return
      }

      // Forecast and depreciation only need product.id — independent of impact config
      if (marketData?.product?.id) {
        setDepreciationLoading(true)
        setForecast30dLoading(true)
        productApi
          .getDepreciationCurve({ productId: marketData.product.id })
          .then(setDepreciationCurve)
          .catch((e) => {
            setDepreciationCurve(null)
            setDepreciationError(e.message || String(e))
          })
          .finally(() => setDepreciationLoading(false))

        productApi
          .getPriceForecast30d({ productId: marketData.product.id })
          .then(setForecast30d)
          .catch((e) => {
            setForecast30d(null)
            setForecast30dError(e.message || String(e))
          })
          .finally(() => setForecast30dLoading(false))
      }

      // Counterfactual impact needs impact config (storage required)
      if (canRunImpactAnalysis(suggestedImpact, searchData?.availableFilters)) {
        void loadCounterfactual(
          keyword,
          suggestedImpact,
          includeAll,
          searchData?.availableFilters,
          marketData?.product?.id
        )
      } else {
        setCounterfactualReport(null)
        setCounterfactualError(null)
        setCounterfactualLoading(false)
      }
    },
    [loadCounterfactual]
  )

  const handleCounterfactualReload = useCallback(
    (includeAll) => {
      setCounterfactualIncludeAll(includeAll)
      if (currentKeyword && impactConfig && isPremiumAnalysis(marketPriceData)) {
        void loadCounterfactual(
          currentKeyword,
          impactConfig,
          includeAll,
          searchResults?.availableFilters,
          marketPriceData?.product?.id
        )
      }
    },
    [currentKeyword, impactConfig, marketPriceData, searchResults, loadCounterfactual]
  )

  const handleImpactConfigApply = useCallback(() => {
    if (!currentKeyword || !impactConfig) return
    void loadCounterfactual(
      currentKeyword,
      impactConfig,
      counterfactualIncludeAll,
      searchResults?.availableFilters,
      marketPriceData?.product?.id
    )
  }, [
    currentKeyword,
    impactConfig,
    counterfactualIncludeAll,
    searchResults,
    marketPriceData?.product?.id,
    loadCounterfactual,
  ])

  const handleSuggestImpactFromListings = useCallback(() => {
    if (!searchResults) return
    setImpactConfig(suggestImpactConfig(searchResults))
  }, [searchResults])

  return {
    depreciationCurve,
    depreciationLoading,
    depreciationError,
    forecast30d,
    forecast30dLoading,
    forecast30dError,
    counterfactualReport,
    counterfactualLoading,
    counterfactualError,
    counterfactualIncludeAll,
    impactConfig,
    setImpactConfig,
    resetAnalysis,
    loadPremiumSideEffects,
    loadCounterfactual,
    handleCounterfactualReload,
    handleImpactConfigApply,
    handleSuggestImpactFromListings,
  }
}
